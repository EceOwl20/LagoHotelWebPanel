import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listen = server => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});

// Run in an isolated checkout/build directory, like the other HTTP suites.
// All users and content are temporary; Azura is a local stub, never production.
test("HTTP sessions enforce hotel isolation before reads, writes, uploads and proxy calls", { timeout: 180_000 }, async t => {
  const data = await mkdtemp(path.join(tmpdir(), "lago-site-auth-data-"));
  t.after(() => rm(data, { recursive: true, force: true }));
  let upstreamCalls = 0;
  const upstream = createServer((request, response) => {
    upstreamCalls++;
    assert.equal(request.headers.authorization, "Bearer test-site-token");
    response.writeHead(200, { "content-type": "application/json" });
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/api/azura/dashboard/summary") {
      const section = url.searchParams.get("sections");
      assert.equal(url.searchParams.get("limit"), "5");
      if (section === "blog") assert.equal(request.headers["x-azura-blog-contract-version"], "3");
      const data = section === "gallery" ? { categoryCount: 9, imageCount: 95 } : {
        total: 0, currentPublishedCount: 0, changedCount: 0, draftCount: 0,
        notifications: { total: 0, items: [] }, ...(section === "blog" ? { latestPost: null } : {}),
      };
      response.end(JSON.stringify({ [section]: { status: "ok", data } }));
      return;
    }
    response.end(JSON.stringify({ images: [] }));
  });
  t.after(() => new Promise(resolve => { upstream.closeAllConnections(); upstream.close(resolve); }));
  const upstreamPort = await listen(upstream);
  const reservation = createServer();
  const port = await listen(reservation);
  await new Promise(resolve => reservation.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  let output = "";
  const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"),
    process.env.SITE_AUTH_TEST_PRODUCTION === "1" ? "start" : "dev",
    "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root, stdio: ["ignore", "pipe", "pipe"], env: {
      ...process.env,
      ADMIN_USERNAME: "site-test-admin", ADMIN_PASSWORD: "SiteTestPassword2026!", ADMIN_PASSWORD_HASH: "",
      ADMIN_SESSION_SECRET: "site-authorization-test-secret-not-for-production",
      PANEL_DATA_ROOT: data, PANEL_UPLOADS_ROOT: path.join(data, "uploads"),
      PANEL_USERS_FILE_PATH: path.join(data, "users.json"),
      AZURA_EXPERIENCE_API_URL: `http://127.0.0.1:${upstreamPort}/api/azura/homepage/experience`,
      AZURA_SERVICE_TOKEN: "test-site-token",
      AZURA_BLOG_CONTRACT_VERSION: "3",
    },
  });
  child.stdout.on("data", chunk => { output = (output + chunk).slice(-12000); });
  child.stderr.on("data", chunk => { output = (output + chunk).slice(-12000); });
  t.after(async () => {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    await new Promise(resolve => {
      const timer = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 5000);
      child.once("exit", () => { clearTimeout(timer); resolve(); });
    });
  });
  const call = (url, cookie, method = "GET", body) => fetch(origin + url, {
    method, redirect: "manual", headers: {
      origin, ...(cookie ? { cookie } : {}), "content-type": "application/json",
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let ready = false;
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error(output);
    try { await call("/api/admin/session"); ready = true; break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(ready, output);
  async function login(username) {
    const response = await call("/api/admin/login", null, "POST", { username, password: "SiteTestPassword2026!" });
    assert.equal(response.status, 200, await response.text());
    return response.headers.get("set-cookie").split(";")[0];
  }
  const admin = await login("site-test-admin");
  const cookies = {};
  for (const site of ["lago", "azura"]) {
    const response = await call("/api/admin/users", admin, "POST", { user: {
      username: `site-test-${site}`, displayName: site, password: "SiteTestPassword2026!", role: "editor", sites: [site],
    } });
    assert.equal(response.status, 201, await response.text());
    cookies[site] = await login(`site-test-${site}`);
  }
  for (const [url, method, site] of [
    ["/api/admin/gallery", "GET", "lago"],
    ["/api/admin/gallery", "PUT", "lago"],
    ["/api/admin/upload", "POST", "lago"],
    ["/api/admin/pages/test/lock", "POST", "lago"],
    ["/api/admin/pages/test/history", "GET", "lago"],
    ["/api/admin/blog/posts/test", "DELETE", "lago"],
    ["/api/admin/search?q=test", "GET", "lago"],
    ["/api/admin/azura/homepage/images", "GET", "azura"],
    ["/api/admin/azura/homepage/images", "POST", "azura"],
    ["/api/admin/azura/bars/page-content", "PUT", "azura"],
    ["/api/admin/azura/media-library/reuse", "POST", "azura"],
    ["/api/admin/azura/blog/posts/test", "DELETE", "azura"],
    ["/api/admin/azura/pages/test/history", "GET", "azura"],
    ["/api/admin/azura/dashboard/summary?section=gallery", "GET", "azura"],
  ]) {
    assert.equal((await call(url, cookies[site === "lago" ? "azura" : "lago"], method)).status, 403, `${method} ${url}`);
    assert.equal((await call(url, null, method)).status, 401, `${method} ${url}`);
  }
  assert.equal(upstreamCalls, 0, "Denied requests must not use the service token");
  for (const cookie of [cookies.lago, admin]) {
    assert.equal((await call("/api/admin/gallery", cookie)).status, 200);
  }
  for (const cookie of [cookies.azura, admin]) {
    assert.equal((await call("/api/admin/azura/homepage/images", cookie)).status, 200);
  }
  assert.equal(upstreamCalls, 2);
  for (const section of ["gallery", "blog", "pages"]) {
    const response = await call(`/api/admin/azura/dashboard/summary?section=${section}`, cookies.azura);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const { summary } = await response.json();
    assert.equal(section === "gallery" ? summary.imageCount : summary.total, section === "gallery" ? 95 : 0);
  }
  for (const section of ["blog", "pages"]) {
    const response = await call(`/api/admin/azura/${section}/summary`, cookies.azura);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { summary: { draftCount: 0, drafts: [] } });
  }
  assert.equal((await call("/api/admin/azura/dashboard/summary?section=unknown", admin)).status, 400);
});
