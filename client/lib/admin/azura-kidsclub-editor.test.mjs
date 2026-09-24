import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AZURA_KIDS_IMAGES, KIDS_MOMENT_IDS } from "./azura-kidsclub-model.mjs";
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
test("Shared Kids editor renders 14 Azura pickers, preserves identities and keeps Lago fields", () => {
  const pickers = [];
  const Site = compile("SitePageMediaEditor.jsx", {
    "../sayfalar/components/PageImagePicker": { __esModule: true, default: (props) => { pickers.push(props); return null; } },
    "./ContentEditLockContext": { useContentEditLockContext: () => null },
  });
  const Kids = compile("KidsClubMediaEditor.jsx", {
    "./SitePageMediaEditor": { __esModule: true, default: Site },
    "@/lib/admin/azura-kidsclub-model.mjs": { AZURA_KIDS_IMAGES },
  });
  const image = () => ({ image: "/uploads/pages/kidsclub/old.jpg", width: 800, height: 600,
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((l) => [l, { alt: "Alt" }])) });
  let media = {};
  for (const field of AZURA_KIDS_IMAGES) {
    let parent = media;
    for (const key of field.path.slice(0, -1)) parent = parent[key] ||= {};
    parent[field.path.at(-1)] = image();
  }
  media.activities.items.activity1.id = "activity1";
  media.activities.items.activity1.order = 0;
  media.moments = { images: KIDS_MOMENT_IDS.map((id, order) => ({ ...image(), id, order })) };
  const asset = { image: "/uploads/pages/kidsclub/new.jpg", width: 1000, height: 700, previewUrl: "http://localhost/new.jpg" };
  const html = renderToStaticMarkup(React.createElement(Kids, {
    hotel: "azura", activeLocale: "tr", value: media, onChange: (fn) => { media = fn(media); }, externalAssets: [asset],
  }));
  assert.equal(pickers.length, 14);
  assert.equal((html.match(/maxLength="300"/g) || []).length, 13);
  pickers.find((p) => p.label === "Etkinlik 1 görseli").onChange(asset.image);
  assert.equal(media.activities.items.activity1.image, asset.image);
  assert.equal(media.activities.items.activity1.width, 1000);
  assert.equal(media.activities.items.activity1.id, "activity1");
  assert.equal(media.activities.items.activity1.order, 0);
  pickers.length = 0;
  const lago = JSON.parse(readFileSync(new URL("../../content/site-pages/kidsclub.json", import.meta.url)));
  renderToStaticMarkup(React.createElement(Kids, { activeLocale: "tr", value: lago, onChange: () => {} }));
  assert.ok(pickers.some((p) => p.label === "Carousel panda göstergesi"));
  assert.ok(pickers.some((p) => p.label === "Oyun Odaları görseli"));
  assert.ok(pickers.some((p) => p.label === "Mini Kulüp kart görseli"));
});
