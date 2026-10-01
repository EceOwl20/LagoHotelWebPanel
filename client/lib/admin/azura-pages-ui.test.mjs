import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as client from "./azura-pages-client.mjs";
import * as schema from "../pages/schema.mjs";
import * as presets from "../pages/page-presets.mjs";
import * as reducer from "../pages/page-draft-reducer.mjs";
import * as blocks from "../pages/block-definitions.mjs";
import { PANEL_PERMISSIONS, hasPanelPermission } from "./permissions.mjs";
import { id, result, revision, nextRevision } from "../../tests/fixtures/azura-pages.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const compile = file => transformSync(readFileSync(new URL(`../../app/[locale]/panel/sayfalar/${file}`, import.meta.url), "utf8"), {
  filename: file, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" },
}).code;
const hookCode = compile("components/useAzuraPage.js");
function harness(enabled = true) {
  const states = [], refs = [], effects = [], calls = [], adopted = [];
  let si = 0, ri = 0, first = true, handler, confirm = true;
  const hooks = {
    useState(initial) { const i = si++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], next => { states[i] = typeof next === "function" ? next(states[i]) : next; }]; },
    useRef(initial) { const i = ri++; refs[i] ||= { current: initial }; return refs[i]; },
    useEffect(fn) { if (first) effects.push(fn); }, useCallback: fn => fn,
  };
  const fetchMock = async (url, options = {}) => {
    calls.push({ url, ...options });
    const override = await handler?.(url, options); if (override) return override;
    if (url.includes("/media-library?")) return Response.json({ images: [], nextOffset: null });
    return Response.json(url.endsWith("/images") ? { images: [] } : result(options.method ? nextRevision : revision));
  };
  const imports = name => name === "react" ? hooks : { ...client,
    pageRequest: (url, options) => client.pageRequest(url, options, fetchMock),
    saveAzuraPage: options => client.saveAzuraPage({ ...options, fetchImpl: fetchMock }),
  };
  const m = { exports: {} };
  new Function("require", "module", "exports", "window", hookCode)(imports, m, m.exports, { confirm: () => confirm });
  const render = () => { si = 0; ri = 0; const remote = m.exports.default({ enabled, pageId: id, acceptSavedDraft: page => adopted.push(page) }); first = false; return remote; };
  return { render, calls, adopted, setHandler: fn => { handler = fn; }, confirm: value => { confirm = value; },
    async mount() { render(); effects.forEach(fn => fn()); await new Promise(resolve => setTimeout(resolve, 0)); return render(); } };
}
test("Azura page hook uses remote media only; disabled Lago hook makes no requests", async () => {
  const h = harness(); await h.mount();
  assert.deepEqual(h.calls.map(call => call.url), ["/api/admin/azura/media-library?limit=100&offset=0"]);
  const lago = harness(false); await lago.mount(); assert.equal(lago.calls.length, 0);
});
test("409 leaves typed draft untouched and blocks further writes until explicit reload", async () => {
  const h = harness(); let remote = await h.mount(); remote.adopt(result());
  const typed = result().page; typed.hero.translations.tr.title = "Unsaved title";
  h.setHandler(async (url, options) => options.method === "PUT" ? Response.json({ error: "Conflict" }, { status: 409 }) : null);
  await assert.rejects(remote.save(typed), { status: 409 });
  assert.equal(typed.hero.translations.tr.title, "Unsaved title");
  assert.equal(h.adopted.length, 1); remote = h.render(); assert.equal(remote.blocked, true);
  await assert.rejects(remote.save(typed)); assert.equal(h.calls.filter(call => call.method === "PUT").length, 1);
  h.confirm(false); await remote.reload(); assert.equal(h.adopted.length, 1);
  h.confirm(true); await remote.reload(); assert.equal(h.render().blocked, false); assert.equal(h.adopted.length, 2);
});
test("concurrent saves are blocked synchronously; restore uses editor revision not refreshed history", async () => {
  const h = harness(); let remote = await h.mount(); remote.adopt(result());
  let release;
  h.setHandler(async (url, options) => options.method === "PUT" ? new Promise(resolve => { release = resolve; }) : null);
  const pending = remote.save(result().page);
  await assert.rejects(remote.save(result().page));
  assert.equal(h.calls.filter(call => call.method === "PUT").length, 1);
  release(Response.json(result(nextRevision))); await pending;
  remote = h.render(); await remote.restore(id);
  const restore = h.calls.find(call => call.url.endsWith("/restore"));
  assert.equal(restore.headers["If-Match"], `"${nextRevision}"`); assert.equal(restore.body, undefined);
});
test("all routes reuse the existing shared forms and isolate Azura locks and providers", () => {
  const builder = readFileSync(new URL("../../app/[locale]/panel/sayfalar/yeni/PageBuilder.jsx", import.meta.url), "utf8");
  assert.match(builder, /usePageEditLock\(isAzura \? null : pageId\)/);
  assert.match(builder, /PageMediaContext.Provider value=\{isAzura \? remote.media : null\}/);
  const page = readFileSync(new URL("../../app/[locale]/panel/azura/sayfalar/yeni/page.jsx", import.meta.url), "utf8");
  assert.match(page, /sayfalar\/yeni\/PageBuilder/);
  const picker = readFileSync(new URL("../../app/[locale]/panel/sayfalar/components/PageImagePicker.jsx", import.meta.url), "utf8");
  assert.match(picker, /librarySource = "media"/);
});

const nodes = (tree, predicate) => {
  const found = [];
  const walk = node => { if (Array.isArray(node)) return node.forEach(walk); if (!node?.props) return;
    if (predicate(node)) found.push(node); walk(node.props.children); };
  walk(tree); return found;
};
const label = node => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(label).join("") : node?.props ? label(node.props.children) : "";
function componentHarness(file, hotel, role = "admin", routeId = id) {
  const states = [], refs = [], effects = [], calls = [], locks = [], navigations = [];
  let si = 0, ri = 0, first = true;
  const stub = () => null;
  const hooks = {
    useState(initial) { const i = si++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], next => { states[i] = typeof next === "function" ? next(states[i]) : next; }]; },
    useReducer(fn, arg, init) { const [state, set] = hooks.useState(() => init(arg)); return [state, action => set(old => fn(old, action))]; },
    useRef(initial) { const i = ri++; refs[i] ||= { current: initial }; return refs[i]; },
    useEffect(fn) { if (first) effects.push(fn); }, useCallback: fn => fn, useMemo: fn => fn(), memo: fn => fn, useDeferredValue: value => value,
  };
  const fetchMock = async (url, options = {}) => {
    calls.push({ url, ...options });
    if (url.endsWith("/images")) return Response.json({ images: [] });
    if (url.endsWith("/pages")) return Response.json({ pages: hotel === "azura" ? [result()] : [{ ...result().page, title: "Lago page" }] });
    return Response.json(result(options.method ? nextRevision : revision));
  };
  const win = { addEventListener: stub, removeEventListener: stub, dispatchEvent: stub, confirm: () => true };
  let remoteHook;
  const imports = name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name.includes("schema.mjs")) return schema;
    if (name.includes("page-presets")) return presets;
    if (name.includes("page-draft-reducer")) return reducer;
    if (name.includes("block-definitions")) return blocks;
    if (name.includes("permissions.mjs")) return { PANEL_PERMISSIONS };
    if (name.includes("PanelSessionContext")) return { usePanelPermission: permission => hasPanelPermission(role, permission) };
    if (name.includes("PageMediaContext")) return { PageMediaContext: { Provider: "media-provider" } };
    if (name.includes("PageTemplateImage")) return { PagePreviewOrigin: { Provider: "preview-provider" } };
    if (name.includes("azura-pages-client")) return { ...client, pageRequest: (url, options) => client.pageRequest(url, options, fetchMock), saveAzuraPage: options => client.saveAzuraPage({ ...options, fetchImpl: fetchMock }) };
    if (name.includes("useAzuraPage")) return { __esModule: true, default: remoteHook };
    if (name.includes("usePageEditLock")) return { __esModule: true, default: key => { locks.push(key); return { status: key ? "owned" : "not-required", editable: true, lockToken: "lago-lock" }; } };
    if (name === "next/navigation") return { useParams: () => ({ id: routeId }) };
    if (name.includes("i18n/navigation")) return { Link: "a", useRouter: () => ({ push: url => navigations.push(url), refresh: stub }) };
    if (name === "react-icons/fi") return new Proxy({}, { get: () => stub });
    return { __esModule: true, default: stub };
  };
  const run = code => { const m = { exports: {} }; new Function("require", "module", "exports", "fetch", "window", code)(imports, m, m.exports, fetchMock, win); return m.exports.default; };
  remoteHook = run(hookCode);
  const Component = run(compile(file));
  const render = () => { si = 0; ri = 0; const tree = Component({ hotel }); first = false; return tree; };
  return { calls, locks, navigations, render, async mount(strictReplay = false) {
    render();
    const cleanups = effects.map(fn => fn());
    if (strictReplay) {
      cleanups.forEach(cleanup => { if (typeof cleanup === "function") cleanup(); });
      effects.forEach(fn => fn());
    }
    await new Promise(resolve => setTimeout(resolve, 0));
    return render();
  } };
}
test("shared list renders Azura records, routes and permanent-delete label without local trash", async () => {
  const h = componentHarness("PagesManager.jsx", "azura"); const tree = await h.mount();
  assert.deepEqual(h.calls.map(call => call.url), ["/api/admin/azura/pages"]);
  assert.ok(nodes(tree, node => node.props.href === `/panel/azura/sayfalar/${id}`).length);
  assert.ok(label(tree).includes("Kalıcı Sil")); assert.equal(label(tree).includes("Çöp Kutusu"), false);
  const lago = componentHarness("PagesManager.jsx", "lago"); const local = await lago.mount();
  assert.deepEqual(lago.calls.map(call => call.url), ["/api/admin/pages"]);
  assert.ok(label(local).includes("Çöp Kutusu"));
});
test("shared builder loads and saves Azura through remote adapter; Lago retains edit-lock headers", async () => {
  for (const hotel of ["azura", "lago"]) {
    const h = componentHarness("yeni/PageBuilder.jsx", hotel); let tree = await h.mount();
    assert.ok(h.locks.every(key => key === (hotel === "azura" ? null : id)));
    const settings = nodes(tree, node => typeof node.props.onDraftChange === "function")[0];
    assert.ok(settings, "Loaded draft is rendered");
    settings.props.onDraftChange({ type: reducer.PAGE_DRAFT_ACTIONS.UPDATE_HERO_TRANSLATION, locale: "tr", field: "title", value: "Edited" });
    tree = h.render();
    const save = nodes(tree, node => node.type === "button" && label(node).trim() === "Değişiklikleri Taslak Olarak Kaydet")[0];
    assert.equal(save.props.disabled, false); await save.props.onClick();
    const put = h.calls.find(call => call.method === "PUT");
    assert.equal(put.url, `${hotel === "azura" ? "/api/admin/azura/pages" : "/api/admin/pages"}/${id}`);
    assert.equal(put.headers[hotel === "azura" ? "If-Match" : "X-Panel-Edit-Lock"], hotel === "azura" ? `"${revision}"` : "lago-lock");
    assert.ok(h.navigations.includes(hotel === "azura" ? "/panel/azura/sayfalar" : "/panel/sayfalar"));
  }
});

test("Strict Mode setup-cleanup-setup does not leave either page editor loading forever", async () => {
  for (const hotel of ["azura", "lago"]) {
    const h = componentHarness("yeni/PageBuilder.jsx", hotel);
    const tree = await h.mount(true);
    assert.equal(label(tree).includes("Sayfa taslağı yükleniyor"), false, hotel);
    assert.ok(nodes(tree, node => typeof node.props.onDraftChange === "function").length, `${hotel} draft loaded`);
  }
});

test("new Azura pages default to hidden navigation; existing values and Lago default are preserved", async () => {
  for (const hotel of ["azura", "lago"]) {
    const fresh = componentHarness("yeni/PageBuilder.jsx", hotel, "admin", undefined);
    // Explicit null denotes the /yeni route (undefined would use the helper default).
    const newPage = componentHarness("yeni/PageBuilder.jsx", hotel, "admin", null);
    const settings = nodes(await newPage.mount(), node => typeof node.props.onDraftChange === "function")[0];
    assert.equal(settings.props.draft.navigation.visible, hotel === "azura" ? false : presets.createPageDraftFromPreset("editorial").navigation.visible);
    settings.props.onDraftChange({ type: reducer.PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_FIELD, field: "visible", value: true });
    assert.equal(nodes(newPage.render(), node => typeof node.props.onDraftChange === "function")[0].props.draft.navigation.visible, true);
    const existing = nodes(await fresh.mount(), node => typeof node.props.onDraftChange === "function")[0];
    assert.equal(existing.props.draft.navigation.visible, result().page.navigation.visible);
  }
});
