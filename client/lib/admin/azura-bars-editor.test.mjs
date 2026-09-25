import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AZURA_BAR_IMAGES } from "./azura-bars-model.mjs";
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
test("Shared Bars editor renders 9 Azura pickers, preserves identities and keeps Lago fields", () => {
  const pickers = [];
  const Site = compile("SitePageMediaEditor.jsx", {
    "../sayfalar/components/PageImagePicker": { __esModule: true, default: (props) => { pickers.push(props); return null; } },
    "./ContentEditLockContext": { useContentEditLockContext: () => null },
  });
  const Bars = compile("BarCafesMediaEditor.jsx", {
    "./SitePageMediaEditor": { __esModule: true, default: Site },
    "@/lib/admin/azura-bars-model.mjs": { AZURA_BAR_IMAGES },
  });
  const image = () => ({ image: "/uploads/pages/bars/old.jpg", width: 800, height: 600,
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((l) => [l, { alt: "Alt" }])) });
  let media = {};
  for (const field of AZURA_BAR_IMAGES) {
    let parent = media;
    for (const key of field.path.slice(0, -1)) parent = parent[key] ||= {};
    parent[field.path.at(-1)] = image();
  }
  media.bars.lobbyPiano.id = "lobbyPiano";
  media.bars.lobbyPiano.order = 0;
  const asset = { image: "/uploads/pages/bars/new.jpg", width: 1000, height: 700, previewUrl: "http://localhost/new.jpg" };
  const html = renderToStaticMarkup(React.createElement(Bars, {
    hotel: "azura", activeLocale: "tr", value: media, onChange: (fn) => { media = fn(media); }, externalAssets: [asset],
  }));
  assert.equal(pickers.length, 9);
  assert.equal((html.match(/maxLength="300"/g) || []).length, 6);
  pickers.find((p) => p.label === "Lobby Piano kart görseli").onChange(asset.image);
  assert.equal(media.bars.lobbyPiano.image, asset.image);
  assert.equal(media.bars.lobbyPiano.width, 1000);
  assert.equal(media.bars.lobbyPiano.id, "lobbyPiano");
  assert.equal(media.bars.lobbyPiano.order, 0);
  pickers.length = 0;
  const lago = JSON.parse(readFileSync(new URL("../../content/site-pages/barcafes.json", import.meta.url)));
  renderToStaticMarkup(React.createElement(Bars, { activeLocale: "tr", value: lago, onChange: () => {} }));
  assert.ok(pickers.some((p) => p.label === "Piano Bar kart görseli"));
  assert.ok(pickers.some((p) => p.label === "Cafe de House kart görseli"));
  assert.ok(pickers.some((p) => p.label === "Mignon Bar kart görseli"));
});
