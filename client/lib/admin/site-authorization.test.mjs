import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as permissions from "./permissions.mjs";
import * as policy from "./user-policy.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const adminRoot = join(root, "app/api/admin");
const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)]);
const globalRoutes = new Set([
  "login/route.js", "logout/route.js", "session/route.js",
  "users/route.js", "users/[id]/route.js",
]);
const routes = walk(adminRoot).filter(path => path.endsWith("/route.js") &&
  !globalRoutes.has(relative(adminRoot, path)));
const sharedHandlers = new Set([
  "azura-image-route.js", "azura-page-content-route.js",
  "azura-blog-route.js", "azura-pages-route.js",
]);
const compiled = new Map();

// Execute actual route handlers and actual authorization; block all domain
// functions so a read, write, proxy request or lock before authorization fails.
function harness(session, overrides = {}) {
  const cache = new Map(), domainCalls = [];
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    if (!compiled.has(path)) compiled.set(path, transformSync(readFileSync(path, "utf8"), {
      filename: path, jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
    }).code);
    const compiledModule = { exports: {} };
    const imports = name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === "server-only") return {};
      if (name === "next/server") return { NextResponse: { json: Response.json } };
      if (name.endsWith("/session")) return { getAdminSession: async () => session };
      if (name.endsWith("/authorization")) return load(join(root, "lib/admin/authorization.js"));
      if (name.endsWith("permissions.mjs")) return permissions;
      if (name.endsWith("user-policy.mjs")) return policy;
      const resolved = name.startsWith("@/") ? join(root, name.slice(2)) : resolve(dirname(path), name);
      if (sharedHandlers.has(`${resolved.split("/").at(-1).replace(/\.js$/, "")}.js`)) {
        return load(resolved.endsWith(".js") ? resolved : `${resolved}.js`);
      }
      return new Proxy({}, { get: (_, key) => {
        if (key === "__esModule") return true;
        return () => { domainCalls.push(`${name}:${String(key)}`); throw new Error("Domain access before authorization"); };
      } });
    };
    new Function("require", "module", "exports", compiled.get(path))(imports, compiledModule, compiledModule.exports);
    cache.set(path, compiledModule.exports);
    return compiledModule.exports;
  }
  return { load, domainCalls };
}

for (const path of routes) {
  const route = relative(adminRoot, path);
  const site = route.startsWith("azura/") ? "azura" : "lago";
  test(`${route}: all methods deny other hotel, absent/empty sites and anonymous`, async () => {
    for (const session of [
      { role: "editor", sites: [site === "azura" ? "lago" : "azura"] },
      { role: "editor", sites: [] }, { role: "editor" }, null,
    ]) {
      const h = harness(session);
      const handlers = h.load(path);
      const methods = Object.keys(handlers).filter(key => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(key));
      assert.ok(methods.length, route);
      for (const method of methods) {
        const request = new Request("http://localhost/api/admin/test?site=azura&hotel=lago", {
          method, headers: { origin: "http://localhost", "x-hotel": site },
        });
        const response = await handlers[method](request, { params: Promise.resolve({}) });
        assert.equal(response.status, session ? 403 : 401, `${route} ${method}`);
        assert.equal(request.bodyUsed, false);
      }
      assert.deepEqual(h.domainCalls, [], route);
    }
  });
}

test("site guard allows assigned editors and both-site admin without changing role permissions", () => {
  const auth = harness(null).load(join(root, "lib/admin/authorization.js"));
  for (const site of ["lago", "azura"]) {
    assert.equal(auth.panelSiteAccessResponse({ role: "editor", sites: [site] }, site), null);
    assert.equal(auth.panelSiteAccessResponse({ role: "admin", sites: ["lago", "azura"] }, site), null);
    assert.equal(auth.panelSiteAccessResponse({ role: "admin", sites: [] }, site).status, 403);
  }
  assert.throws(() => auth.assertPanelPermission({ role: "editor" }, permissions.PANEL_PERMISSIONS.DELETE_CONTENT));
});

test("assigned editor and admin can still read Lago gallery/blog and Azura images", async () => {
  for (const role of ["editor", "admin"]) {
    for (const [route, site, dependency, method, payload, expected] of [
      ["gallery/route.js", "lago", "@/lib/admin/gallery", "readGallery", {}, { gallery: {} }],
      ["blog/posts/route.js", "lago", "@/lib/admin/blog", "listBlogPosts", [], { posts: [] }],
      ["azura/homepage/images/route.js", "azura", "@/lib/admin/azura-experience-images.mjs", "requestAzuraImages", [], { images: [] }],
    ]) {
      let calls = 0;
      const h = harness({ role, sites: role === "admin" ? ["lago", "azura"] : [site] }, {
        [dependency]: { [method]: async () => { calls++; return payload; } },
      });
      const response = await h.load(join(adminRoot, route)).GET();
      assert.equal(response.status, 200, `${role} ${route}`);
      assert.deepEqual(await response.json(), expected);
      assert.equal(calls, 1);
    }
  }
});
