import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AZURA_ROOM_DETAIL_CONFIGS, azuraRoomDetailConfig } from "./room-detail-model.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const source = readFileSync(new URL("../../app/[locale]/panel/azura/icerikler/page.jsx", import.meta.url), "utf8");
const { code } = transformSync(source, {
  filename: "page.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
});

function renderTree(selectedId, query = "") {
  const compiledModule = { exports: {} };
  const stub = () => null;
  const imports = (name) => {
    if (name === "react") return {
      useState: (initial) => [initial === "homepage" ? selectedId : initial === "" ? query : initial, stub],
      useRef: (current) => ({ current }),
      useCallback: (fn) => fn,
      useEffect: stub,
    };
    if (name === "react/jsx-runtime") return require(name);
    if (name.includes("room-detail-model")) return { AZURA_ROOM_DETAIL_CONFIGS, azuraRoomDetailConfig };
    if (name.includes("PanelSessionContext")) return { usePanelPermission: () => true };
    if (name.includes("permissions.mjs")) return { PANEL_PERMISSIONS: { EDIT_CONTENT: "edit" } };
    if (name.includes("ContentWorkspace")) return {
      ContentWorkspaceHeader: stub, ContentWorkspaceNavigation: stub, ContentWorkspaceToolbar: stub,
    };
    return { __esModule: true, default: stub, FiSave: stub };
  };
  new Function("require", "module", "exports", code)(imports, compiledModule, compiledModule.exports);
  return compiledModule.exports.default();
}

function navigationGroups(query = "") {
  let groups;
  function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node?.props) return;
    if (node.props.groups) groups = node.props.groups;
    walk(node.props.children);
  }
  walk(renderTree("homepage", query));
  return groups;
}

test("Azura navigation groups use existing visual IDs and keep all content exactly once", () => {
  const groups = navigationGroups();
  assert.deepEqual(groups.map((g) => g.id), ["general", "home", "rooms", "food", "pages"]);
  assert.deepEqual(groups.map((g) => g.label), ["Genel Alanlar", "Ana Sayfa", "Odalar", "Yemek ve İçecek", "Sayfalar"]);
  assert.deepEqual(groups.find((g) => g.id === "general").items.map((i) => i.id), ["contact"]);
  assert.deepEqual(groups.find((g) => g.id === "rooms").items.map((i) => i.id),
    ["rooms", ...Object.values(AZURA_ROOM_DETAIL_CONFIGS).map((r) => r.roomKey)]);
  assert.deepEqual(groups.find((g) => g.id === "food").items.map((i) => i.id), ["restaurants", "bars"]);
  assert.deepEqual(groups.find((g) => g.id === "pages").items.map((i) => i.id),
    ["about", "spa", "spor", "beachpools", "kidsclub", "entertainment"]);
  const ids = groups.flatMap((g) => g.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 14);
});

test("Azura navigation supports group search, individual pages and empty results", () => {
  assert.deepEqual(navigationGroups("Yemek ve İçecek").map((g) => g.id), ["food"]);
  assert.equal(navigationGroups("Sayfalar")[0].items.length, 6);
  assert.equal(navigationGroups("Odalar")[0].items.length, 4);
  assert.deepEqual(navigationGroups("Barlar")[0].items.map((i) => i.id), ["bars"]);
  assert.deepEqual(navigationGroups("bulunmayan-kategori"), []);
});

const sections = {
  entertainment: "Azura Eğlence sayfası",
  bars: "Azura Barlar sayfası",
  kidsclub: "Azura Çocuk Kulübü sayfası",
  beachpools: "Azura Plaj ve Havuzlar sayfası",
  spor: "Azura Spor sayfası",
  spa: "Azura Spa sayfası",
  rooms: "Azura oda sayfası",
  restaurants: "Azura restoran sayfası",
  about: "Azura Hakkımızda sayfası",
};
for (const [id, label] of Object.entries(sections)) {
  test(`Azura ${id} seçilince editörü gizli bir üst kapsayıcıda kalmaz`, () => {
    const matches = [];
    function walk(node, hidden = false) {
      if (Array.isArray(node)) { node.forEach((child) => walk(child, hidden)); return; }
      if (!node || typeof node !== "object" || !node.props) return;
      const nextHidden = hidden || String(node.props.className || "").split(/\s+/).includes("hidden");
      if (node.props["aria-label"] === label) matches.push(nextHidden);
      walk(node.props.children, nextHidden);
    }
    walk(renderTree(id));
    assert.deepEqual(matches, [false]);
  });
}
