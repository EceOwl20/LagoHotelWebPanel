import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AZURA_ENTERTAINMENT_IMAGES } from "./azura-entertainment-model.mjs";
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transformSync } = require("next/dist/build/swc");
function compile(name, imports) {
  const path = new URL("../../app/[locale]/panel/icerikler/" + name, import.meta.url);
  const { code } = transformSync(readFileSync(path, "utf8"), {
    filename: name, jsc: { parser: { syntax: "ecmascript", jsx: true },
      transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", code)((key) => imports[key] || require(key), compiledModule, compiledModule.exports);
  return compiledModule.exports.default;
}
test("Shared Entertainment editor renders 12 Azura pickers, preserves identities and keeps Lago fields", () => {
  const pickers = [];
  const inputs = [];
  const runtime = require("react/jsx-runtime");
  const capture = (fn) => (type, props, ...args) => {
    if (type === "input" && props.maxLength === 300) inputs.push(props);
    return fn(type, props, ...args);
  };
  const Site = compile("SitePageMediaEditor.jsx", {
    "react/jsx-runtime": { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) },
    "../sayfalar/components/PageImagePicker": { __esModule: true, default: (props) => { pickers.push(props); return null; } },
    "./ContentEditLockContext": { useContentEditLockContext: () => null },
  });
  const Entertainment = compile("EntertainmentMediaEditor.jsx", {
    "./SitePageMediaEditor": { __esModule: true, default: Site },
    "@/lib/admin/azura-entertainment-model.mjs": { AZURA_ENTERTAINMENT_IMAGES },
  });
  const image = () => ({ image: "/uploads/pages/entertainment/old.jpg", width: 800, height: 600,
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((l) => [l, { alt: "Alt" }])) });
  let media = { activities: [], gridSection: [] };
  for (const field of AZURA_ENTERTAINMENT_IMAGES) {
    let parent = media;
    for (const key of field.path.slice(0, -1)) parent = parent[key] ||= {};
    parent[field.path.at(-1)] = image();
  }
  media.activities[0].id = "daytime";
  media.activities[0].order = 0;
  const asset = { image: "/uploads/pages/entertainment/new.jpg", width: 1000, height: 700, previewUrl: "http://localhost/new.jpg" };
  const html = renderToStaticMarkup(React.createElement(Entertainment, {
    hotel: "azura", activeLocale: "tr", value: media, onChange: (fn) => { media = fn(media); }, externalAssets: [asset],
  }));
  assert.equal(pickers.length, 12);
  assert.equal((html.match(/maxLength="300"/g) || []).length, 11);
  pickers.find((p) => p.label === "Gündüz aktiviteleri görseli").onChange(asset.image);
  assert.equal(media.activities[0].image, asset.image);
  assert.equal(media.activities[0].width, 1000);
  assert.equal(media.activities[0].id, "daytime");
  assert.equal(media.activities[0].order, 0);
  assert.ok(Array.isArray(media.activities));
  assert.equal(media.activities.length, 2);
  assert.ok(Array.isArray(media.gridSection));
  assert.equal(media.gridSection.length, 9);
  inputs[0].onChange({ target: { value: "Yeni alt açıklama" } });
  assert.ok(Array.isArray(media.activities));
  assert.equal(media.activities[0].translations.tr.alt, "Yeni alt açıklama");
  assert.equal(media.activities[0].id, "daytime");
  pickers.find((p) => p.label === "Dart ve Boccia kart görseli").onChange(asset.image);
  assert.ok(Array.isArray(media.gridSection));
  assert.equal(media.gridSection.length, 9);
  assert.equal(media.gridSection[8].image, asset.image);
  pickers.length = 0;
  const lago = JSON.parse(readFileSync(new URL("../../content/site-pages/entertainment.json", import.meta.url)));
  renderToStaticMarkup(React.createElement(Entertainment, { activeLocale: "tr", value: lago, onChange: () => {} }));
  assert.ok(pickers.some((p) => p.label === "Tema Partileri kart görseli"));
  assert.ok(pickers.some((p) => p.label === "Gün Batımı Partileri kart görseli"));
  assert.ok(pickers.some((p) => p.label === "Sahne Şovları kart görseli"));
});
