import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { input, record, id } from "./fixtures/azura-pages.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listen = (server, host = "127.0.0.1") => new Promise(resolve => server.listen(0, host, () => resolve(server.address().port)));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test("Lago dynamic-pages HTTP routes preserve Azura lifecycle, revisions, history and media isolation", { timeout: 180000 }, async () => {
  const token = "integration-only-dynamic-pages-token";
  let current = null, asset = null, app, output = "", serial = 0;
  const revision = () => createHash("sha256").update(JSON.stringify(current)).digest("hex");
  const result = () => ({ record: current, revision: revision() });
  const calls = [];
  // In-memory contract server: no real Azura data or uploaded files are changed.
  const upstream = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const send = (body, status = 200) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    calls.push({ method: req.method, url: req.url, authorization: req.headers.authorization });
    if (req.headers.authorization !== `Bearer ${token}`) return send({ error: "Unauthorized" }, 401);
    if (req.url === "/api/azura/pages/images") {
      if (req.method === "GET") return send({ images: asset ? [{ ...asset, modifiedAt: "2026-09-29T00:00:00.000Z" }] : [] });
      asset = { image: "/uploads/dynamic-pages/test.webp", mimeType: "image/webp", size: 4, width: 800, height: 600 };
      return send(asset, 201);
    }
    if (req.url === "/api/azura/pages" && req.method === "GET") return send({ pages: current ? [result()] : [] });
    if (req.url === "/api/azura/pages" && req.method === "POST") {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      current = record(); Object.assign(current.draft, body.draft); return send(result(), 201);
    }
    if (!current) return send({ error: "Missing" }, 404);
    if (req.method === "GET") return send(result());
    if (req.headers["if-match"] !== `"${revision()}"`) return send({ error: "Conflict" }, 409);
    if (req.method === "DELETE") { const deleted = { deleted: true, ...result() }; current = null; return send(deleted); }
    const time = new Date(Date.parse(current.updatedAt) + ++serial).toISOString();
    if (req.url.endsWith("/restore")) {
      const versionId = req.url.split("/").at(-2);
      const previous = current.history.find(version => version.versionId === versionId);
      if (!previous) return send({ error: "Missing version" }, 404);
      current.draft = structuredClone(previous.draft); current.updatedAt = time; return send(result());
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    current.updatedAt = time;
    if (body.action === "save") {
      current.history.unshift({ versionId: randomUUID(), createdAt: time, action: "draft-save", createdBy: null,
        wasPublished: Boolean(current.published), draft: structuredClone(current.draft) });
      Object.assign(current.draft, body.draft, { updatedAt: time });
    }
    if (body.action === "publish") { current.published = { ...structuredClone(current.draft), status: "published" }; current.publishedAt = time; }
    if (body.action === "unpublish") { current.published = null; current.publishedAt = null; }
    send(result());
  });
  const temporary = await mkdtemp(path.join(os.tmpdir(), "lago-azura-pages-data-"));
  try {
    // The locale layout reads shared Lago media even on panel routes.
    // Seed isolated copies, never point write APIs at the user's content root.
    await mkdir(path.join(temporary, "content/site-pages"), { recursive: true });
    for (const page of ["homepage", "contactsection2"]) await cp(path.join(root, `content/site-pages/${page}.json`), path.join(temporary, `content/site-pages/${page}.json`));
    await cp(path.join(root, "messages"), path.join(temporary, "messages"), { recursive: true });
    const upstreamPort = await listen(upstream);
    const probe = createServer(), port = await listen(probe, "localhost"); await new Promise(resolve => probe.close(resolve));
    const origin = `http://localhost:${port}`;
    app = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), process.env.AZURA_PAGES_TEST_PRODUCTION === "1" ? "start" : "dev", "--hostname", "localhost", "--port", String(port)], {
      cwd: root, env: { ...process.env, ADMIN_USERNAME: "pages-test-admin", ADMIN_PASSWORD: "PagesTestPassword!2026", ADMIN_PASSWORD_HASH: "",
        ADMIN_SESSION_SECRET: "pages-test-session-secret-not-for-production", PANEL_USERS_FILE_PATH: path.join(temporary, "users.json"),
        PANEL_DATA_ROOT: temporary, PANEL_UPLOADS_ROOT: path.join(temporary, "uploads"), AZURA_SERVICE_TOKEN: token,
        AZURA_EXPERIENCE_API_URL: `http://127.0.0.1:${upstreamPort}/api/azura/homepage/experience` }, stdio: ["ignore", "pipe", "pipe"],
    });
    const remember = chunk => { output = `${output}${chunk}`.slice(-16000); };
    app.stdout.on("data", remember); app.stderr.on("data", remember);
    const deadline = Date.now() + 45000; let ready = false;
    while (Date.now() < deadline) {
      try { await fetch(`${origin}/api/admin/session`); ready = true; break; } catch { await pause(200); }
    }
    assert.ok(ready, output);
    let cookie = "";
    const request = (url, method = "GET", body, rev) => fetch(`${origin}${url}`, { method,
      headers: { origin, ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}), ...(rev ? { "if-match": `"${rev}"` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const base = "/api/admin/azura/pages";
    assert.equal((await request(base)).status, 401);
    const login = await request("/api/admin/login", "POST", { username: "pages-test-admin", password: "PagesTestPassword!2026" });
    assert.equal(login.status, 200); cookie = login.headers.get("set-cookie").split(";")[0];
    assert.deepEqual((await (await request(base)).json()).pages, []);
    const created = await request(base, "POST", { draft: input() });
    assert.equal(created.status, 201); let payload = await created.json(), rev = payload.revision;
    assert.equal(payload.page.id, id); assert.equal(current.published, null);
    const url = `${base}/${id}`, stale = rev;
    assert.equal((await request(url, "PUT", { action: "publish" })).status, 428);
    const publish = await request(url, "PUT", { action: "publish" }, rev); assert.equal(publish.status, 200); rev = (await publish.json()).revision;
    const liveTitle = current.published.hero.translations.tr.title;
    const edited = input(); edited.hero.translations.tr.title = "Yeni taslak";
    const saved = await request(url, "PUT", { action: "save", draft: edited }, rev); assert.equal(saved.status, 200); payload = await saved.json(); rev = payload.revision;
    assert.equal(payload.page.hasUnpublishedChanges, true); assert.equal(current.published.hero.translations.tr.title, liveTitle);
    assert.equal((await request(url, "PUT", { action: "publish" }, stale)).status, 409);
    const history = await (await request(`${url}/history`)).json(); assert.equal(history.record.history.length, 1);
    const restored = await request(`${url}/history/${history.record.history[0].versionId}/restore`, "POST", undefined, rev);
    assert.equal(restored.status, 200); payload = await restored.json(); rev = payload.revision;
    assert.equal(payload.page.hero.translations.tr.title, liveTitle); assert.equal(current.published.hero.translations.tr.title, liveTitle);
    const unpublish = await request(url, "PUT", { action: "unpublish" }, rev); assert.equal(unpublish.status, 200); rev = (await unpublish.json()).revision;
    assert.equal(current.published, null);
    const form = new FormData(); form.append("file", new Blob(["webp"], { type: "image/webp" }), "test.webp");
    const upload = await fetch(`${origin}${base}/images`, { method: "POST", headers: { cookie, origin }, body: form });
    assert.equal(upload.status, 201);
    const images = await (await request(`${base}/images`)).json(); assert.equal(images.images.length, 1);
    assert.ok(images.images[0].previewUrl.endsWith("/uploads/dynamic-pages/test.webp"));
    for (const route of ["/tr/panel/azura/sayfalar", "/tr/panel/azura/sayfalar/yeni", `/tr/panel/azura/sayfalar/${id}`, "/tr/panel/sayfalar", "/tr/panel/sayfalar/yeni"]) {
      const response = await request(route); assert.equal(response.status, 200, `${route}\n${output}`);
      assert.equal((await response.text()).includes(token), false);
    }
    assert.equal((await request(url, "DELETE", undefined, stale)).status, 409);
    assert.equal((await request(url, "DELETE", undefined, rev)).status, 200);
    assert.deepEqual((await (await request(base)).json()).pages, []);
    assert.equal((await (await request(`${base}/images`)).json()).images.length, 1);
    assert.ok(calls.every(call => call.url.startsWith("/api/azura/pages") && call.authorization === `Bearer ${token}`));
  } finally {
    if (app && app.exitCode === null) { app.kill("SIGTERM"); await Promise.race([new Promise(resolve => app.once("exit", resolve)), pause(5000)]); if (app.exitCode === null) app.kill("SIGKILL"); }
    upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  }
});
