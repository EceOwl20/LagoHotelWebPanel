import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AZURA_GALLERY_CATEGORIES, GALLERY_LOCALES } from "./azura-gallery-model.mjs";
import * as model from "./azura-gallery-model.mjs";
import * as revisions from "./azura-revision.mjs";
import * as mediaLibrary from "./azura-media-library-client.mjs";
import { PANEL_PERMISSIONS, hasPanelPermission } from "./permissions.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const source = readFileSync(new URL("../../app/[locale]/panel/galeri/GalleryManager.jsx", import.meta.url), "utf8");
const { code } = transformSync(source, { filename: "GalleryManager.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" } });
const empty = () => Object.fromEntries(GALLERY_LOCALES.map((l) => [l, { alt: "" }]));
const translations = Object.fromEntries(GALLERY_LOCALES.map((l) => [l, { alt: "Description" }]));
const record = (id, order) => ({ id, order, src: "/uploads/gallery/shared.jpg", width: 800, height: 600, translations });
const gallery = { schemaVersion: 1, categories: AZURA_GALLERY_CATEGORIES.map((id) =>
  ({ id, images: id === "general" ? [record("first", 0), record("second", 1)] : [] })) };
const revision = "a".repeat(64);
function harness(hotel, role = "admin") {
  const states = [], refs = [], effects = [], calls = [], locks = [];
  let stateIndex = 0, refIndex = 0, first = true, handler = null;
  const stub = () => null;
  const hooks = {
    useState(initial) {
      const i = stateIndex++;
      if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], (next) => { states[i] = typeof next === "function" ? next(states[i]) : next; }];
    },
    useRef(initial) { const i = refIndex++; refs[i] ||= { current: initial }; return refs[i]; },
    useEffect(fn) { if (first) effects.push(fn); },
    useMemo(fn) { return fn(); }, useCallback(fn) { return fn; },
  };
  const fetchMock = async (url, init = {}) => {
    calls.push({ url, ...init });
    if (handler) { const answer = await handler(url, init); if (answer) return answer; }
    if (url.includes("/media-library?")) return Response.json({ images: [], nextOffset: null });
    if (url.endsWith("/media-library/reuse")) return Response.json({ image: "/uploads/gallery/shared.jpg", width: 800, height: 600 });
    return { ok: true, json: async () => url.endsWith("/images") ? { images: [] } :
      hotel === "azura" ? { gallery: structuredClone(gallery), revision, mediaOrigin: "http://azura.test" } :
        { gallery: { categories: [{ id: "general", images: [record("lago-image", 0)] }] } } };
  };
  const imports = (name) => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name.includes("azura-media-library-client")) return {
      loadAzuraLibrary: options => mediaLibrary.loadAzuraLibrary({ ...options, fetchImpl: fetchMock }),
      reuseAzuraImage: (image, scope) => mediaLibrary.reuseAzuraImage(image, scope, { fetchImpl: fetchMock }),
    };
    if (name.includes("azura-gallery-model")) return model;
    if (name.includes("azura-revision")) return revisions;
    if (name.includes("GalleryAltFields")) return { __esModule: true, default: stub, emptyGalleryTranslations: empty };
    if (name.includes("PanelSessionContext")) return { usePanelPermission: (permission) => hasPanelPermission(role, permission) };
    if (name.includes("permissions.mjs")) return { PANEL_PERMISSIONS };
    if (name.includes("useGalleryCategoryEditLock")) return { __esModule: true, default: (id) => {
      locks.push(id); return { editable: true, lockToken: "lago-lock", retry: async () => true };
    } };
    if (name === "react-icons/fi") return new Proxy({}, { get: () => stub });
    return { __esModule: true, default: stub, IMAGE_UPLOAD_ACCEPT: "image/*" };
  };
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", "fetch", "window", "document", code)(
    imports, compiledModule, compiledModule.exports, fetchMock,
    { addEventListener: stub, removeEventListener: stub, confirm: () => true },
    { activeElement: null });
  const render = () => {
    stateIndex = 0; refIndex = 0;
    const result = compiledModule.exports.default({ hotel });
    first = false;
    return result;
  };
  return { calls, locks, render, setHandler: (fn) => { handler = fn; },
    async mount() { render(); effects.forEach((fn) => fn()); await new Promise((r) => setTimeout(r, 0)); return render(); } };
}
function nodes(tree, predicate) {
  const result = [];
  function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node?.props) return;
    if (predicate(node)) result.push(node);
    walk(node.props.children);
  }
  walk(tree); return result;
}
function label(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(label).join("");
  return node?.props ? label(node.props.children) : "";
}
const button = (tree, text) => nodes(tree, (n) => n.type === "button" && label(n) === text)[0];

test("The same gallery manager isolates hotel fetches, locks, previews and categories", async () => {
  const azura = harness("azura"), tree = await azura.mount();
  assert.ok(azura.calls.every((c) => c.url.startsWith("/api/admin/azura/gallery") || c.url.startsWith("/api/admin/azura/media-library?")));
  assert.ok(azura.locks.every((id) => id === ""));
  assert.ok(nodes(tree, (n) => n.props.src === "http://azura.test/uploads/gallery/shared.jpg").length);
  assert.ok(label(tree).includes("Toplantı"));
  assert.ok(button(tree, "Alt açıklamaları düzenle"));
  const lago = harness("lago"), localTree = await lago.mount();
  assert.deepEqual(lago.calls.map((c) => c.url), ["/api/admin/gallery"]);
  assert.ok(lago.locks.includes("general"));
  assert.equal(button(localTree, "Alt açıklamaları düzenle"), undefined);
  assert.ok(nodes(localTree, (n) => n.props.src === "/uploads/gallery/shared.jpg").length);
});

test("Azura remove uses PATCH, never DELETE, and displays non-destructive confirmation", async () => {
  const h = harness("azura");
  let tree = await h.mount();
  button(tree, "Kaldır").props.onClick();
  tree = h.render();
  assert.ok(label(tree).includes("Fiziksel dosya ve diğer kategorilerdeki kayıtlar silinmez."));
  await button(tree, "Evet, galeriden kaldır").props.onClick();
  const call = h.calls.find((c) => c.method === "PATCH");
  assert.deepEqual(JSON.parse(call.body), { revision, operation: { action: "remove", categoryId: "general", imageId: "first" } });
  assert.equal(h.calls.some((c) => c.method === "DELETE"), false);
});

test("Azura 409 retains alt draft and blocks mutations until explicit refresh", async () => {
  const h = harness("azura");
  let tree = await h.mount();
  button(tree, "Alt açıklamaları düzenle").props.onClick();
  tree = h.render();
  const altFields = nodes(tree, (n) => n.props.value?.tr?.alt === "Description")[0];
  altFields.props.onChange({ ...translations, tr: { alt: "Taslak" } });
  h.setHandler(async (_url, init) => init.method === "PATCH" ?
    { ok: false, status: 409, json: async () => ({ error: "Conflict" }) } : null);
  await button(h.render(), "Alt açıklamaları kaydet").props.onClick();
  tree = h.render();
  assert.equal(button(tree, "Alt açıklamaları kaydet").props.disabled, true);
  assert.ok(nodes(tree, (n) => n.props.value?.tr?.alt === "Taslak").length);
  await button(tree, "Güncel galeriyi yükle").props.onClick();
  tree = h.render();
  assert.equal(button(tree, "Alt açıklamaları kaydet").props.disabled, false);
  assert.ok(nodes(tree, (n) => n.props.value?.tr?.alt === "Taslak").length);
});

test("Azura editor cannot remove and category reorder uses revision", async () => {
  const h = harness("azura", "editor");
  let tree = await h.mount();
  assert.equal(button(tree, "Kaldır"), undefined);
  const down = nodes(tree, (n) => n.props["aria-label"] === "1. görseli aşağı taşı")[0];
  await down.props.onClick();
  const body = JSON.parse(h.calls.find((c) => c.method === "PATCH").body);
  assert.deepEqual(body.operation, { action: "reorder", categoryId: "general", imageIds: ["second", "first"] });
  assert.equal(body.revision, revision);
});

test("Lago ordering retains PUT and its edit-lock header", async () => {
  const h = harness("lago");
  const tree = await h.mount();
  // Direct handler invocation confirms the existing local transport independently of disabled UI.
  await nodes(tree, (n) => n.props["aria-label"] === "1. görseli aşağı taşı")[0].props.onClick();
  const call = h.calls.find((c) => c.method === "PUT");
  assert.equal(call.url, "/api/admin/gallery");
  assert.equal(call.headers["X-Panel-Edit-Lock"], "lago-lock");
  assert.equal(h.calls.some((c) => c.url.includes("/azura/")), false);
});

test("Azura upload stages an image; only explicit add publishes four-language metadata", async () => {
  const h = harness("azura");
  let tree = await h.mount();
  const asset = { image: "/uploads/gallery/new.jpg", mimeType: "image/jpeg", size: 3, width: 800, height: 600 };
  h.setHandler(async (_url, init) => init.method === "POST" ?
    { ok: true, json: async () => asset } : null);
  const file = new Blob(["jpg"], { type: "image/jpeg" });
  await nodes(tree, (n) => n.props.type === "file")[0].props.onChange({ target: { files: [file], value: "selected" } });
  assert.equal(h.calls.some((c) => c.method === "PATCH"), false);
  assert.deepEqual([...h.calls.find((c) => c.method === "POST").body.keys()], ["file"]);
  tree = h.render();
  assert.equal(button(tree, "Kategoriye ekle").props.disabled, true);
  nodes(tree, (n) => n.props.value?.tr?.alt === "")[0].props.onChange(translations);
  tree = h.render();
  assert.equal(button(tree, "Kategoriye ekle").props.disabled, false);
  await button(tree, "Kategoriye ekle").props.onClick();
  const body = JSON.parse(h.calls.find((c) => c.method === "PATCH").body);
  assert.deepEqual(body, { revision, operation: { action: "add", categoryId: "general", src: asset.image, translations } });
  assert.ok(label(h.render()).includes("Görsel kategoriye eklendi."));
});
