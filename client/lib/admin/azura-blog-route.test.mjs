import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as model from "./azura-blog-model.mjs";
import { PANEL_PERMISSIONS, hasPanelPermission } from "./permissions.mjs";
import { input, revision } from "../../tests/fixtures/azura-blog.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("./azura-blog-route.js", import.meta.url), "utf8"), {
  filename: "route.js", jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
});
function harness(role = "admin") {
  const calls = []; let limited = false;
  const deny = (status) => { throw Object.assign(new Error("Denied"), { status }); };
  const imports = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/admin/session": { getAdminSession: async () => role ? { role } : null },
    "@/lib/admin/authorization": { assertPanelPermission: (s, p) => { if (!hasPanelPermission(s.role, p)) deny(403); } },
    "@/lib/admin/permissions.mjs": { PANEL_PERMISSIONS },
    "@/lib/admin/security": { assertSameOrigin: r => { if (r.headers.get("origin") !== "http://localhost") deny(403); },
      consumeRateLimit: () => ({ ok: !limited }), getClientIp: () => "test" },
    "./azura-blog-model.mjs": model,
    "./azura-blog.mjs": { requestAzuraBlog: async (...args) => { calls.push(args); return { post: {} }; } },
  };
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", code)(n => imports[n], compiledModule, compiledModule.exports);
  return { calls, limit: () => { limited = true; }, run: (method, body, headers = {}, slug = "azura-post") => {
    const detail = method !== "POST" && slug !== undefined;
    const request = new Request("http://localhost/api/admin/azura/blog/posts", { method,
      headers: { origin: "http://localhost", "content-type": "application/json", "if-match": `"${revision}"`, ...headers },
      ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }) });
    return compiledModule.exports.azuraBlogHandler(method, detail)(request, { params: Promise.resolve({ slug }) });
  } };
}
test("Blog proxy routes enforce session and server-side edit/publish/delete permissions", async () => {
  const anonymous = harness(null);
  assert.equal((await anonymous.run("GET")).status, 401);
  assert.equal((await anonymous.run("POST", { slug: "post", draft: input() })).status, 401);
  const editor = harness("editor");
  assert.equal((await editor.run("PUT", { action: "save", draft: input() })).status, 200);
  assert.equal((await editor.run("POST", { slug: "post", draft: input() })).status, 201);
  assert.equal((await editor.run("PUT", { action: "publish" })).status, 403);
  assert.equal((await editor.run("PUT", { action: "unpublish" })).status, 403);
  assert.equal((await editor.run("DELETE")).status, 403);
  assert.equal(editor.calls.length, 2);
  const admin = harness();
  for (const action of ["publish", "unpublish"]) assert.equal((await admin.run("PUT", { action })).status, 200);
  assert.equal((await admin.run("DELETE")).status, 200);
  assert.deepEqual(admin.calls[2], ["DELETE", undefined, { slug: "azura-post", revision }]);
  assert.equal((await admin.run("GET")).headers.get("cache-control"), "no-store");
});
test("Blog routes reject bad origin, slug, revision, body and attempts to smuggle publication", async () => {
  const h = harness();
  const save = { action: "save", draft: input() };
  assert.equal((await h.run("PUT", save, { origin: "https://evil.test" })).status, 403);
  assert.equal((await h.run("GET", undefined, {}, "../bad")).status, 400);
  assert.equal((await h.run("PUT", save, { "if-match": "" })).status, 428);
  assert.equal((await h.run("PUT", save, { "if-match": revision })).status, 400);
  assert.equal((await h.run("PUT", save, { "content-type": "text/plain" })).status, 415);
  assert.equal((await h.run("PUT", "{")).status, 400);
  assert.equal((await h.run("PUT", { ...save, publicationStatus: "published" })).status, 400);
  assert.equal((await h.run("POST", { slug: "post", draft: { ...input(), status: "published" } })).status, 400);
  assert.equal((await h.run("DELETE", {})).status, 400);
  assert.equal((await h.run("PUT", save, { "content-length": String(128 * 1024 + 1) })).status, 413);
  assert.equal((await h.run("PUT", "x".repeat(128 * 1024 + 1))).status, 413);
  assert.equal(h.calls.length, 0);
  h.limit(); assert.equal((await h.run("PUT", save)).status, 429);
});
