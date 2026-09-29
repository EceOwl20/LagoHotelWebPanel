import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PANEL_PERMISSIONS, hasPanelPermission } from "./permissions.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("./azura-pages-route.js", import.meta.url), "utf8"), {
  filename: "route.js", jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
});
const id = "12345678-1234-1234-1234-123456789abc", revision = "a".repeat(64);
function harness(role = "admin") {
  const calls = []; let limited = false;
  const deny = status => { throw Object.assign(new Error("Denied"), { status }); };
  const imports = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/admin/session": { getAdminSession: async () => role ? { role } : null },
    "@/lib/admin/authorization": { assertPanelPermission: (s, p) => { if (!hasPanelPermission(s.role, p)) deny(403); } },
    "@/lib/admin/permissions.mjs": { PANEL_PERMISSIONS },
    "@/lib/admin/security": { assertSameOrigin: r => { if (r.headers.get("origin") !== "http://localhost") deny(403); },
      consumeRateLimit: () => ({ ok: !limited }), getClientIp: () => "test" },
    "./azura-pages.mjs": { requestAzuraPages: async (...args) => { calls.push(args); return { page: {} }; } },
  };
  const compiled = { exports: {} };
  new Function("require", "module", "exports", code)(name => imports[name], compiled, compiled.exports);
  return { calls, limit: () => { limited = true; }, run: (method, body, headers = {}, scope = "detail") => {
    const request = new Request("http://localhost/api/admin/azura/pages", { method,
      headers: { origin: "http://localhost", "content-type": "application/json", "if-match": `"${revision}"`, ...headers },
      ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }) });
    return compiled.exports.azuraPagesHandler(method, scope)(request, { params: Promise.resolve({ id, versionId: id }) });
  } };
}
test("page routes enforce session, edit, publish, delete and restore permissions", async () => {
  assert.equal((await harness(null).run("GET")).status, 401);
  const editor = harness("editor");
  assert.equal((await editor.run("PUT", { action: "save", draft: {} })).status, 200);
  assert.equal((await editor.run("POST", undefined, {}, "restore")).status, 200);
  assert.equal((await editor.run("PUT", { action: "publish" })).status, 403);
  assert.equal((await editor.run("PUT", { action: "unpublish" })).status, 403);
  assert.equal((await editor.run("DELETE")).status, 403);
  assert.equal(editor.calls.length, 2);
  const admin = harness();
  assert.equal((await admin.run("DELETE")).status, 200);
  assert.equal((await admin.run("GET", undefined, {}, "history")).headers.get("cache-control"), "no-store");
  assert.equal(admin.calls[1][2].history, true);
});
test("page routes reject bad origin, missing revision, bodies and oversized streams", async () => {
  const h = harness();
  assert.equal((await h.run("PUT", { action: "publish" }, { origin: "https://evil.test" })).status, 403);
  assert.equal((await h.run("PUT", { action: "publish" }, { "if-match": "" })).status, 428);
  assert.equal((await h.run("POST", undefined, { "if-match": revision }, "restore")).status, 400);
  assert.equal((await h.run("DELETE", {})).status, 400);
  assert.equal((await h.run("POST", {}, {}, "restore")).status, 400);
  assert.equal((await h.run("PUT", "broken")).status, 400);
  assert.equal((await h.run("PUT", {}, { "content-type": "text/plain" })).status, 415);
  assert.equal((await h.run("PUT", "x".repeat(128 * 1024 + 1))).status, 413);
  assert.equal(h.calls.length, 0);
  h.limit();
  assert.equal((await h.run("DELETE")).status, 429);
});
