import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("../../app/[locale]/panel/components/PanelMediaPreview.jsx", import.meta.url), "utf8"), {
  filename: "PanelMediaPreview.jsx", jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" },
});
const m = { exports: {} };
new Function("require", "module", "exports", code)(name => {
  if (name === "next/image") return { __esModule: true, default: ({ src, alt, loading, fetchPriority }) => React.createElement("img", { src, alt, loading, fetchPriority }) };
  if (name.includes("observe-media-preview")) return { observeMediaPreview: () => { throw new Error("SSR must not observe"); } };
  return require(name);
}, m, m.exports);
const render = props => renderToStaticMarkup(React.createElement(m.exports.default, props));

test("eager preview exposes its image immediately without high fetch priority", () => {
  const html = render({ src: "/uploads/test.jpg", eager: true, alt: "Test" });
  assert.match(html, /<img/);
  assert.match(html, /loading="eager"/);
  assert.doesNotMatch(html, /fetchPriority|fetchpriority/);
});

test("default previews still defer their image source", () => {
  assert.doesNotMatch(render({ src: "/uploads/test.jpg" }), /<img|\/uploads\/test/);
});

test("missing eager source shows fallback without a broken image request", () => {
  const html = render({ eager: true });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /Önizleme yüklenemedi/);
});
