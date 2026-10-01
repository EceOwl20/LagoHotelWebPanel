import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { readMediaReuseRequest } from "./azura-media-library-request.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("../../app/api/admin/azura/media-library/reuse/route.js", import.meta.url), "utf8"), {
  filename: "route.js", jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
});
function harness({ authenticated = true, access = true, edit = true, rate = true } = {}) {
  const calls = [];
  const deny = () => { throw Object.assign(new Error("Denied"), { status: 403 }); };
  const imports = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/admin/azura-media-library-request.mjs": { readMediaReuseRequest },
    "@/lib/admin/session": { getAdminSession: async () => authenticated ? {} : null },
    "@/lib/admin/authorization": { assertPanelSiteAccess: (_, site) => { assert.equal(site, "azura"); if (!access) deny(); },
      assertPanelPermission: () => { if (!edit) deny(); } },
    "@/lib/admin/permissions.mjs": { PANEL_PERMISSIONS: { EDIT_CONTENT: "edit" } },
    "@/lib/admin/security": { assertSameOrigin: r => { if (r.headers.get("origin") !== "http://local") deny(); },
      consumeRateLimit: () => ({ ok: rate, retryAfterSeconds: 60 }), getClientIp: () => "test" },
    "@/lib/admin/azura-media-library.mjs": { reuseAzuraMediaLibraryImage: async body => {
      calls.push(body); return { status: 201, image: { image: "/uploads/pages/about/copy.jpg", width: 10, height: 20 } };
    } },
  };
  const m = { exports: {} };
  new Function("require", "module", "exports", code)(name => imports[name], m, m.exports);
  return { calls, run: (body = '{"image":"/uploads/blog/a.jpg","targetScope":"about"}', headers = {}) => m.exports.POST(new Request("http://local/reuse", {
    method: "POST", headers: { origin: "http://local", "content-type": "application/json", ...headers }, body,
  })) };
}
test("reuse proxy blocks unauthenticated, other-hotel, read-only, cross-origin and limited writes", async () => {
  for (const [options, status] of [[{ authenticated: false }, 401], [{ access: false }, 403], [{ edit: false }, 403], [{ rate: false }, 429]]) {
    const h = harness(options); assert.equal((await h.run()).status, status); assert.equal(h.calls.length, 0);
  }
  const h = harness(); assert.equal((await h.run(undefined, { origin: "https://other.test" })).status, 403);
  assert.equal(h.calls.length, 0);
});
test("reuse proxy does not forward invalid JSON/type/size and preserves creation response", async () => {
  const h = harness();
  assert.equal((await h.run("{")).status, 400);
  assert.equal((await h.run("{}", { "content-type": "text/plain" })).status, 415);
  assert.equal((await h.run("x".repeat(4097))).status, 413);
  assert.equal(h.calls.length, 0);
  const response = await h.run();
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(h.calls, [{ image: "/uploads/blog/a.jpg", targetScope: "about" }]);
});
