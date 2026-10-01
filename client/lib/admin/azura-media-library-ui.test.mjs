import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as library from "./azura-media-library-client.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function harness(file, props = {}, fetchImpl = async () => Response.json({ images: [], nextOffset: null })) {
  const states = [], refs = [], effects = [], pending = [];
  let si = 0, ri = 0, ei = 0;
  const hooks = {
    useState(initial) { const i = si++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], next => { states[i] = typeof next === "function" ? next(states[i]) : next; }]; },
    useRef(initial) { const i = ri++; refs[i] ||= { current: initial }; return refs[i]; },
    useMemo: fn => fn(), useContext: () => null,
    useEffect(fn, deps) { const i = ei++; if (!effects[i] || deps.some((v, n) => v !== effects[i].deps[n])) {
      effects[i]?.cleanup?.(); effects[i] = { deps }; pending.push(() => { effects[i].cleanup = fn(); });
    } },
  };
  const { code } = transformSync(readFileSync(new URL(`../../app/[locale]/panel/${file}`, import.meta.url), "utf8"), {
    filename: file, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" },
  });
  const stub = () => null;
  const imports = name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name.includes("azura-media-library-client")) return { ...library,
      loadAzuraLibrary: options => library.loadAzuraLibrary({ ...options, fetchImpl }),
      reuseAzuraImage: (image, scope) => library.reuseAzuraImage(image, scope, { fetchImpl }),
    };
    if (name.includes("useGalleryCategoryEditLock")) return { __esModule: true, default: () => ({ editable: true }) };
    return new Proxy({ __esModule: true, default: stub }, { get: (target, key) => target[key] || stub });
  };
  const m = { exports: {} };
  new Function("require", "module", "exports", "fetch", "window", code)(imports, m, m.exports, fetchImpl,
    { setTimeout: fn => setTimeout(fn, 0), clearTimeout });
  const render = () => { si = 0; ri = 0; ei = 0; const tree = m.exports.default(props); pending.splice(0).forEach(fn => fn()); return tree; };
  return { render, async settle() { render(); await tick(); render(); await tick(); return render(); } };
}
function nodes(tree, match) {
  const result = [];
  const walk = node => { if (Array.isArray(node)) return node.forEach(walk); if (!node?.props) return;
    if (match(node)) result.push(node); walk(node.props.children); };
  walk(tree); return result;
}
const text = node => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
const button = (tree, title) => nodes(tree, node => node.type === "button" && text(node).includes(title))[0];

test("site picker reuses a cross-page image and sends dimensions without publishing", async () => {
  const calls = [], changes = [];
  const source = { image: "/uploads/blog/source.jpg", name: "source.jpg", folder: "blog", width: 100, height: 200 };
  const copied = { image: "/uploads/pages/about/copied.jpg", width: 100, height: 200 };
  const h = harness("sayfalar/components/PageImagePicker.jsx", {
    label: "Test", value: "", externalAssets: [], uploadFolder: "pages/about", onChange: (...args) => changes.push(args),
  }, async (url, init) => { calls.push({ url, ...init }); return Response.json(url.endsWith("/reuse") ? copied : { images: [source], nextOffset: null, mediaOrigin: "https://azura.test" }); });
  button(h.render(), "Görsel Seç").props.onClick();
  let tree = await h.settle();
  await button(tree, "source.jpg").props.onClick();
  assert.deepEqual(changes, [[copied.image, copied]]);
  assert.equal(calls.filter(call => call.method === "POST").length, 1);
  assert.deepEqual(JSON.parse(calls.at(-1).body), { image: source.image, targetScope: "about" });
  assert.equal(nodes(h.render(), node => node.props.role === "dialog").length, 0);
});

test("failed reuse leaves the picker open and form unchanged; Lago uses its own library", async () => {
  const changes = [];
  const h = harness("sayfalar/components/PageImagePicker.jsx", {
    label: "Test", externalAssets: [{ image: "/uploads/blog/a.jpg" }], uploadFolder: "pages/about", onChange: v => changes.push(v),
  }, async url => url.endsWith("/reuse") ? Response.json({ error: "Copy failed" }, { status: 500 }) : Response.json({ images: [{ image: "/uploads/blog/a.jpg" }], nextOffset: null }));
  button(h.render(), "Görsel Seç").props.onClick();
  await button(await h.settle(), "a.jpg").props.onClick();
  assert.equal(changes.length, 0);
  assert.match(text(h.render()), /Copy failed/);
  const calls = [];
  const lago = harness("sayfalar/components/PageImagePicker.jsx", { label: "Lago", uploadFolder: "pages/about" }, async url => {
    calls.push(url); return Response.json({ library: { assets: [], folders: [] } });
  });
  button(lago.render(), "Görsel Seç").props.onClick(); await lago.settle();
  assert.deepEqual(calls, ["/api/admin/media"]);
});

test("late load-more response cannot contaminate a new search", async () => {
  let release;
  const image = name => ({ image: `/uploads/blog/${name}.jpg`, name, size: 10, width: 1, height: 1 });
  const h = harness("azura/medya/page.js", {}, async url => {
    const query = new URL(url, "http://local").searchParams;
    if (query.get("offset") === "60") return new Promise(resolve => { release = resolve; });
    return Response.json({ images: [image(query.get("q") || "old")], total: 61, nextOffset: query.get("q") ? null : 60, mediaOrigin: "https://azura.test" });
  });
  const initial = await h.settle();
  const more = button(initial, "Daha fazla").props.onClick();
  nodes(h.render(), n => n.type === "input" && n.props.type === "search")[0].props.onChange({ target: { value: "new" } });
  await h.settle();
  release(Response.json({ images: [image("stale")], total: 61, nextOffset: null }));
  await more;
  const result = text(h.render());
  assert.match(result, /new/);
  assert.doesNotMatch(result, /stale/);
});
