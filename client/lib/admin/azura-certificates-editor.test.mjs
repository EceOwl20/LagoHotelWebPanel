import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

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
test("Certificates shared editor preserves Lago controls and fixed Azura src/metadata", () => {
  const pickers = [];
  const Site = compile("SitePageMediaEditor.jsx", {
    "../sayfalar/components/PageImagePicker": { __esModule: true, default: (props) => { pickers.push(props); return null; } },
    "./ContentEditLockContext": { useContentEditLockContext: () => null },
  });
  const Certificates = compile("CertificateMediaEditor.jsx", {
    "./SitePageMediaEditor": { __esModule: true, default: Site },
  });
  const image = () => ({ image: "/uploads/pages/certificates/old.jpg", width: 800, height: 600,
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((l) => [l, { alt: "Alt" }])) });
  let media = { hero: image(), feature: image(), gallery: { images: Array.from({length: 6}, (_, order) => {
    const {image: src, ...rest} = image(); return { ...rest, src, id: "certificate-" + order, order };
  }) } };
  delete media.hero.translations;
  const asset = { image: "/uploads/pages/certificates/new.jpg", width: 1000, height: 700, previewUrl: "http://localhost/new.jpg" };
  const html = renderToStaticMarkup(React.createElement(Certificates, {
    hotel: "azura", activeLocale: "tr", value: media, onChange: (fn) => { media = fn(media); }, externalAssets: [asset],
  }));
  assert.equal(pickers.length, 8);
  assert.equal((html.match(/maxLength="300"/g) || []).length, 7);
  assert.ok(!html.includes("Görseli Çıkar"));
  pickers[2].onChange(asset.image);
  assert.equal(media.gallery.images[0].src, asset.image);
  assert.equal(media.gallery.images[0].width, 1000);
  assert.equal(media.gallery.images[0].height, 700);
  assert.equal(media.gallery.images[0].id, "certificate-0");
  assert.equal(media.gallery.images[0].order, 0);
  assert.equal(Object.hasOwn(media.gallery.images[0], "image"), false);
  pickers[0].onChange(asset.image);
  assert.equal(media.hero.image, asset.image);
  assert.equal(Object.hasOwn(media.hero, "translations"), false);
  pickers.length = 0;
  const lago = JSON.parse(readFileSync(new URL("../../content/site-pages/certificates.json", import.meta.url)));
  const lagoHtml = renderToStaticMarkup(React.createElement(Certificates, { activeLocale: "tr", value: lago, onChange: () => {} }));
  assert.ok(pickers.length > 2);
  assert.ok(lagoHtml.includes("Görseli Çıkar"));
  assert.equal((lagoHtml.match(/maxLength="300"/g) || []).length, 0);
});
