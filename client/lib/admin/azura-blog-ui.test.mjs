import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as client from "./azura-blog-client.mjs";
import * as model from "./azura-blog-model.mjs";
import * as selection from "./blog-selection.mjs";
import { PANEL_PERMISSIONS, hasPanelPermission } from "./permissions.mjs";
import { view, revision, nextRevision } from "../../tests/fixtures/azura-blog.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const compile = file => transformSync(readFileSync(new URL(`../../app/[locale]/panel/blog/${file}`, import.meta.url), "utf8"), {
  filename: file, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
}).code;
const managerCode = compile("BlogManager.jsx"), hookCode = compile("useAzuraBlog.js");
function harness(hotel = "azura", role = "admin", version = 2) {
  const states = [], refs = [], effects = [], calls = [], locks = [], confirmations = [];
  let si = 0, ri = 0, first = true, handler, allowConfirm = true;
  const stub = () => null;
  const hooks = {
    useState(initial) { const i = si++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], next => { states[i] = typeof next === "function" ? next(states[i]) : next; }]; },
    useRef(initial) { const i = ri++; refs[i] ||= { current: initial }; return refs[i]; },
    useEffect(fn) { if (first) effects.push(fn); }, useCallback: fn => fn, useMemo: fn => fn(),
  };
  const fetchMock = async (url, init = {}) => {
    calls.push({ url, ...init });
    const override = await handler?.(url, init); if (override) return override;
    if (url.includes("/media-library?")) return Response.json({ images: [], nextOffset: null, mediaOrigin: "https://azura.test" });
    return Response.json(url.endsWith("/images") ? { images: [] } : init.method === "DELETE" ? { deleted: true, slug: "azura-post" } :
      init.method ? { post: view("azura-post", false, nextRevision) } : { posts: [view()], mediaOrigin: "https://azura.test" });
  };
  const win = { addEventListener: stub, removeEventListener: stub, confirm: msg => { confirmations.push(msg); return allowConfirm; } };
  let remoteHook;
  const imports = name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name.includes("azura-blog-client")) return { ...client,
      blogRequest: (url, init) => client.blogRequest(url, init, fetchMock), saveAzuraBlog: options => client.saveAzuraBlog({ ...options, fetchImpl: fetchMock }) };
    if (name.includes("azura-blog-model")) return model;
    if (name.includes("blog-selection")) return selection;
    if (name.includes("constants")) return { CMS_LOCALES: model.BLOG_LOCALES };
    if (name.includes("permissions.mjs")) return { PANEL_PERMISSIONS };
    if (name.includes("PanelSessionContext")) return { usePanelPermission: p => hasPanelPermission(role, p) };
    if (name.includes("useAzuraBlog")) return { __esModule: true, default: remoteHook };
    if (name.includes("useBlogEditLock")) return { __esModule: true, default: slug => {
      locks.push(slug); return { editable: true, lockToken: "lago-lock" };
    } };
    if (name === "react-icons/fi") return new Proxy({}, { get: () => stub });
    return { __esModule: true, default: stub };
  };
  const run = code => { const m = { exports: {} }; new Function("require", "module", "exports", "fetch", "window", code)(imports, m, m.exports, fetchMock, win); return m.exports.default; };
  remoteHook = run(hookCode);
  const Manager = run(managerCode);
  const render = () => { si = 0; ri = 0; const tree = Manager({ hotel, azuraContractVersion: version }); first = false; return tree; };
  return { calls, locks, confirmations, render, setHandler: fn => { handler = fn; }, confirm: allow => { allowConfirm = allow; },
    async mount() { render(); effects.forEach(fn => fn()); await new Promise(r => setTimeout(r, 0)); return render(); } };
}
function nodes(tree, predicate) {
  const found = [];
  const walk = node => { if (Array.isArray(node)) return node.forEach(walk); if (!node?.props) return;
    if (predicate(node)) found.push(node); walk(node.props.children); };
  walk(tree); return found;
}
const label = n => typeof n === "string" || typeof n === "number" ? String(n) : Array.isArray(n) ? n.map(label).join("") : n?.props ? label(n.props.children) : "";
const button = (tree, title) => nodes(tree, n => n.type === "button" && label(n).trim() === title)[0];

test("Shared blog UI fetches only the selected hotel's data and uses Azura-only media without local locks", async () => {
  const azura = harness(); const tree = await azura.mount();
  assert.ok(azura.calls.every(c => c.url.startsWith("/api/admin/azura/blog/") || c.url.startsWith("/api/admin/azura/media-library?")));
  assert.ok(azura.locks.every(slug => slug === null));
  const picker = nodes(tree, n => n.props.label === "Kapak görseli")[0];
  assert.equal(picker.props.librarySource, "media");
  assert.deepEqual(picker.props.externalAssets, []);
  assert.equal(picker.props.uploadAccept, "image/jpeg,image/png,image/webp");
  const lago = harness("lago"); const localTree = await lago.mount();
  assert.deepEqual(lago.calls.map(c => c.url), ["/api/admin/blog/posts"]);
  assert.ok(lago.locks.includes("azura-post"));
  assert.equal(nodes(localTree, n => n.props.label === "Kapak görseli")[0].props.externalAssets, undefined);
  await button(localTree, "Taslağı Kaydet").props.onClick();
  const put = lago.calls.find(c => c.method === "PUT");
  assert.equal(put.url, "/api/admin/blog/posts/azura-post");
  assert.equal(put.headers["X-Panel-Edit-Lock"], "lago-lock");
});

test("409 preserves typed text and requires explicit reload/discard; editor has no publish/delete buttons", async () => {
  const h = harness("azura", "editor"); let tree = await h.mount();
  assert.equal(button(tree, "Yayınla"), undefined); assert.equal(button(tree, "Yazıyı Sil"), undefined);
  nodes(tree, n => n.type === "input" && n.props.value === "tr title")[0].props.onChange({ target: { value: "Unsaved title" } });
  h.setHandler(async (_url, init) => init.method === "PUT" ? Response.json({ error: "Conflict" }, { status: 409 }) : null);
  await button(h.render(), "Taslağı Kaydet").props.onClick();
  tree = h.render();
  assert.ok(nodes(tree, n => n.props.value === "Unsaved title").length);
  assert.equal(button(tree, "Taslağı Kaydet").props.disabled, true);
  h.confirm(false); await button(tree, "Sunucudaki kaydı yükle").props.onClick();
  assert.ok(nodes(h.render(), n => n.props.value === "Unsaved title").length);
  h.confirm(true); await button(h.render(), "Sunucudaki kaydı yükle").props.onClick();
  tree = h.render(); assert.equal(button(tree, "Taslağı Kaydet").props.disabled, false);
  assert.ok(nodes(tree, n => n.props.value === "tr title").length);
});

test("Azura deletion sends revision and explicitly preserves physical media", async () => {
  const h = harness(); const tree = await h.mount();
  await button(tree, "Yazıyı Sil").props.onClick();
  const deleted = h.calls.find(c => c.method === "DELETE");
  assert.equal(deleted.url, "/api/admin/azura/blog/posts/azura-post");
  assert.equal(deleted.headers["If-Match"], `"${revision}"`);
  assert.equal(deleted.body, undefined);
  assert.ok(h.confirmations[0].includes("Fiziksel görseller korunacak"));
  assert.ok(label(h.render()).includes("Fiziksel görseller korundu"));
});

test("Azura blocks overlapping saves and article switches while a write is pending", async () => {
  const h = harness(); const tree = await h.mount();
  let release;
  h.setHandler(async (_url, init) => init.method === "PUT" ? new Promise(r => { release = r; }) : null);
  const saving = button(tree, "Taslağı Kaydet").props.onClick();
  await button(tree, "Taslağı Kaydet").props.onClick();
  const during = h.render();
  assert.ok(button(during, "Yeni Yazı").props.disabled);
  assert.ok(button(during, "Yazıyı Sil").props.disabled);
  assert.equal(h.calls.filter(c => c.method === "PUT").length, 1);
  release(Response.json({ post: view("azura-post", false, nextRevision) })); await saving;
  assert.equal(button(h.render(), "Taslağı Kaydet").props.disabled, false);
});

test("V3 shared form edits only the active locale and preserves the key and published URL", async () => {
  const h = harness("azura", "admin", 3);
  const post = {...view(), slugs:{tr:"tatil",en:"holiday",de:"urlaub",ru:"otdyh"},
    publishedSlugs:{tr:"eski-tatil",en:"holiday",de:"urlaub",ru:"otdyh"}};
  h.setHandler(async (_url, init) => !init.method ? Response.json({posts:[post],mediaOrigin:"https://azura.test"}) : null);
  let tree = await h.mount();
  assert.equal(h.calls.find(c => c.url.endsWith("/posts")).headers["X-Azura-Blog-Contract-Version"], "3");
  const key = nodes(tree, n => n.type === "input" && n.props.value === "azura-post")[0];
  assert.equal(key.props.disabled, true);
  nodes(tree,n=>n.props["aria-label"]==="Türkçe adresi (slug)")[0].props.onChange({target:{value:"yeni-tatil"}});
  tree = h.render();
  assert.ok(label(tree).includes("/tr/news/eski-tatil"));
  button(tree,"en").props.onClick();
  tree = h.render();
  assert.equal(nodes(tree,n=>n.props["aria-label"]==="English adresi (slug)")[0].props.value,"holiday");
  h.setHandler(async (_url, init) => init.method === "PUT" ? Response.json({error:"Conflict"},{status:409}) : null);
  await button(tree,"Taslağı Kaydet").props.onClick();
  const put = h.calls.find(c=>c.method==="PUT");
  assert.equal(put.url,"/api/admin/azura/blog/posts/azura-post");
  assert.deepEqual(JSON.parse(put.body).draft.slugs,{...post.slugs,tr:"yeni-tatil"});
  tree = h.render();
  assert.equal(button(tree,"Taslağı Kaydet").props.disabled,true);
  button(tree,"tr").props.onClick();
  assert.equal(nodes(h.render(),n=>n.props["aria-label"]==="Türkçe adresi (slug)")[0].props.value,"yeni-tatil");
});

test("V3 initial migration error disables writes and empty list initializes four slug fields", async () => {
  const h = harness("azura","admin",3);
  h.setHandler(async url=>url.endsWith("/posts") ? Response.json({error:"Migration required",code:"BLOG_MIGRATION_REQUIRED"},{status:503}) : null);
  let tree=await h.mount();
  assert.equal(button(tree,"Taslağı Kaydet").props.disabled,true);
  h.setHandler(async url=>url.endsWith("/posts") ? Response.json({posts:[],mediaOrigin:"https://azura.test"}) : null);
  await button(tree,"Sunucudaki kaydı yükle").props.onClick();
  tree=h.render();
  assert.equal(nodes(tree,n=>n.props["aria-label"]==="Türkçe adresi (slug)")[0].props.value,"");
  assert.ok(nodes(tree,n=>n.type==="input" && /^[a-f0-9-]{36}$/.test(n.props.value)).length);
});
