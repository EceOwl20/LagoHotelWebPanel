import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { input, record } from "./fixtures/azura-blog.mjs";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listen = server => new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test("Lago HTTP blog proxy isolates Azura CRUD, draft/publication, revisions and uploads", { timeout: 120000 }, async () => {
  const token = "integration-only-azura-service-token";
  let current = null, serial = 0, asset = null, app, output = "";
  const currentRevision = () => createHash("sha256").update(JSON.stringify(current)).digest("hex");
  const result = () => ({ record: current, revision: currentRevision() });
  const upstreamCalls = [];
  // Contract fixture only: never writes to a real Azura application or content directory.
  const upstream = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const send = (value, status = 200) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(value)); };
    upstreamCalls.push({ method: req.method, url: req.url, authorization: req.headers.authorization });
    if (req.headers.authorization !== `Bearer ${token}`) return send({ error: "Unauthorized" }, 401);
    if (req.url === "/api/azura/blog/images") {
      if (req.method === "GET") return send({ images: asset ? [{ ...asset, modifiedAt: "2026-09-28T10:00:00.000Z" }] : [] });
      asset = { image: "/uploads/blog/upload.jpg", mimeType: "image/jpeg", size: 3, width: 800, height: 600 };
      return send(asset, 201);
    }
    if (req.url === "/api/azura/blog/posts" && req.method === "GET") return send({ posts: current ? [result()] : [] });
    if (req.method === "POST") {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      if (current) return send({ error: "Duplicate" }, 409);
      current = record(body.slug); current.draft = { ...current.draft, ...body.draft };
      return send(result(), 201);
    }
    if (!current) return send({ error: "Missing" }, 404);
    if (req.method === "GET") return send(result());
    if (req.headers["if-match"] !== `"${currentRevision()}"`) return send({ error: "Conflict" }, 409);
    if (req.method === "DELETE") { const slug = current.slug; current = null; return send({ deleted: true, slug }); }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    current.updatedAt = new Date(Date.parse(current.updatedAt) + ++serial).toISOString();
    if (body.action === "save") current.draft = { ...current.draft, ...body.draft, updatedAt: current.updatedAt };
    if (body.action === "publish") { current.published = { ...structuredClone(current.draft), status: "published" }; current.publicationUpdatedAt = current.updatedAt; }
    if (body.action === "unpublish") { current.published = null; current.publicationUpdatedAt = null; }
    send(result());
  });
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "lago-azura-blog-"));
  try {
    const upstreamPort = await listen(upstream);
    const probe = createServer(); const port = await listen(probe); await new Promise(resolve => probe.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    app = spawn(process.execPath, [path.join(clientRoot, "node_modules/next/dist/bin/next"),
      process.env.AZURA_BLOG_TEST_PRODUCTION === "1" ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: clientRoot, env: { ...process.env, ADMIN_USERNAME: "blog-test-admin", ADMIN_PASSWORD: "BlogTestPassword!2026",
        ADMIN_PASSWORD_HASH: "", ADMIN_SESSION_SECRET: "blog-test-session-secret-not-for-production",
        PANEL_USERS_FILE_PATH: path.join(temporaryRoot, "users.json"), PANEL_DATA_ROOT: temporaryRoot,
        PANEL_UPLOADS_ROOT: path.join(temporaryRoot, "uploads"), AZURA_SERVICE_TOKEN: token,
        AZURA_EXPERIENCE_API_URL: `http://127.0.0.1:${upstreamPort}/api/azura/homepage/experience` },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const remember = chunk => { output = `${output}${chunk}`.slice(-10000); };
    app.stdout.on("data", remember); app.stderr.on("data", remember);
    const deadline = Date.now() + 45000;
    let ready = false;
    while (Date.now() < deadline) {
      try { await fetch(`${origin}/api/admin/session`); ready = true; break; } catch { await pause(200); }
    }
    assert.ok(ready, output);
    const base = "/api/admin/azura/blog/posts";
    let cookie = "";
    const request = (url, method = "GET", body, revision) => fetch(`${origin}${url}`, {
      method, headers: { origin, ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}),
        ...(revision ? { "if-match": `"${revision}"` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.equal((await request(base)).status, 401);
    const login = await request("/api/admin/login", "POST", { username: "blog-test-admin", password: "BlogTestPassword!2026" });
    assert.equal(login.status, 200); cookie = login.headers.get("set-cookie").split(";")[0];
    assert.deepEqual((await (await request(base)).json()).posts, []);
    const created = await request(base, "POST", { slug: "azura-post", draft: input() });
    assert.equal(created.status, 201);
    const originalRevision = (await created.json()).post.revision;
    assert.equal(current.published, null);
    const url = `${base}/azura-post`;
    assert.equal((await request(url, "PUT", { action: "publish" })).status, 428);
    const published = await request(url, "PUT", { action: "publish" }, originalRevision);
    assert.equal(published.status, 200); let rev = (await published.json()).post.revision;
    const edited = input(); edited.translations.tr.title = "Draft changed";
    const saved = await request(url, "PUT", { action: "save", draft: edited }, rev);
    assert.equal(saved.status, 200); const savedView = (await saved.json()).post; rev = savedView.revision;
    assert.equal(savedView.hasUnpublishedChanges, true);
    assert.equal(current.published.translations.tr.title, "tr title");
    assert.equal((await request(url, "PUT", { action: "publish" }, originalRevision)).status, 409);
    const live = await request(url, "PUT", { action: "publish" }, rev); rev = (await live.json()).post.revision;
    assert.equal(current.published.translations.tr.title, "Draft changed");
    const unpublish = await request(url, "PUT", { action: "unpublish" }, rev); rev = (await unpublish.json()).post.revision;
    assert.equal(current.published, null);
    const form = new FormData(); form.append("file", new Blob(["jpg"], { type: "image/jpeg" }), "cover.jpg");
    const upload = await fetch(`${origin}/api/admin/azura/blog/images`, { method: "POST", headers: { cookie, origin }, body: form });
    assert.equal(upload.status, 201);
    const images = await (await request("/api/admin/azura/blog/images")).json();
    assert.equal(images.images.length, 1); assert.ok(images.images[0].previewUrl.endsWith("/uploads/blog/upload.jpg"));
    assert.equal((await request(url, "DELETE", undefined, originalRevision)).status, 409);
    assert.equal((await request(url, "DELETE", undefined, rev)).status, 200);
    assert.equal((await (await request("/api/admin/azura/blog/images")).json()).images.length, 1);
    assert.deepEqual((await (await request(base)).json()).posts, []);
    assert.ok(upstreamCalls.every(c => c.url.startsWith("/api/azura/blog/") && c.authorization === `Bearer ${token}`));
  } finally {
    if (app && app.exitCode === null) {
      app.kill("SIGTERM");
      await Promise.race([new Promise(resolve => app.once("exit", resolve)), pause(5000)]);
      if (app.exitCode === null) app.kill("SIGKILL");
    }
    upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
