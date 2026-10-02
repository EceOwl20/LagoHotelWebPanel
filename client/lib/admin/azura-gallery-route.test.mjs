import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as model from "./azura-gallery-model.mjs";
import * as revisionModule from "./azura-revision.mjs";
import { PANEL_PERMISSIONS, hasPanelPermission } from "./permissions.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("../../app/api/admin/azura/gallery/route.js", import.meta.url), "utf8"), {
  filename: "route.js", jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
});
function setup(role = "admin") {
  const calls = [];
  let limited = false;
  const deny = (message, status) => { throw Object.assign(new Error(message), { status }); };
  const imports = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/admin/session": { getAdminSession: async () => role ? { role, sites: ["azura"] } : null },
    "@/lib/admin/authorization": { assertPanelSiteAccess: (session, site) => {
      if (!session?.sites?.includes(site)) deny("Forbidden", 403);
    }, assertPanelPermission: (session, permission) => {
      if (!hasPanelPermission(session.role, permission)) deny("Forbidden", 403);
    } },
    "@/lib/admin/permissions.mjs": { PANEL_PERMISSIONS },
    "@/lib/admin/security": {
      assertSameOrigin: (r) => { if (r.headers.get("origin") !== "http://localhost") deny("Bad origin", 403); },
      consumeRateLimit: () => ({ ok: !limited }), getClientIp: () => "test",
    },
    "@/lib/admin/azura-revision.mjs": revisionModule,
    "@/lib/admin/azura-gallery-model.mjs": model,
    "@/lib/admin/azura-gallery.mjs": { requestAzuraGallery: async (...args) => {
      calls.push(args); return { gallery: {}, revision: "a".repeat(64) };
    } },
  };
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", code)((key) => imports[key], compiledModule, compiledModule.exports);
  return { ...compiledModule.exports, calls, limit: () => { limited = true; } };
}
const operation = { action: "remove", categoryId: "general", imageId: "gallery-one" };
const body = { operation, revision: "a".repeat(64) };
const request = (value = body, headers = {}) => new Request("http://localhost/api/admin/azura/gallery", {
  method: "PATCH", headers: { origin: "http://localhost", "content-type": "application/json", ...headers },
  body: typeof value === "string" ? value : JSON.stringify(value),
});
test("Gallery route enforces session, edit/delete permissions and origin before proxying", async () => {
  const anonymous = setup(null);
  assert.equal((await anonymous.GET()).status, 401);
  assert.equal((await anonymous.PATCH(request())).status, 401);
  assert.equal(anonymous.calls.length, 0);
  const editor = setup("editor");
  assert.equal((await editor.PATCH(request())).status, 403);
  assert.equal(editor.calls.length, 0);
  const admin = setup();
  assert.equal((await admin.PATCH(request(body, { origin: "http://other.test" }))).status, 403);
  assert.equal((await admin.PATCH(request())).status, 200);
  assert.deepEqual(admin.calls[0], ["PATCH", operation, { revision: body.revision }]);
  assert.equal((await admin.GET()).headers.get("cache-control"), "no-store");
});
test("Gallery route rejects malformed/oversized bodies, missing revision and rate excess", async () => {
  const h = setup();
  assert.equal((await h.PATCH(request("{"))).status, 400);
  assert.equal((await h.PATCH(request({ operation }))).status, 400);
  assert.equal((await h.PATCH(request(body, { "content-type": "text/plain" }))).status, 415);
  assert.equal((await h.PATCH(request(body, { "content-length": String(128 * 1024 + 1) }))).status, 413);
  assert.equal((await h.PATCH(request("x".repeat(128 * 1024 + 1)))).status, 413);
  assert.equal(h.calls.length, 0);
  h.limit();
  assert.equal((await h.PATCH(request())).status, 429);
});
