import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { createAsyncCache } from "./async-cache.mjs";
import { createMediaScanLimit } from "./media-scan-limit.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("./media-library.js", import.meta.url), "utf8"), {
  filename: "media-library.js", jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
});
function library(root) {
  const m = { exports: {} };
  const imports = name => name === "server-only" ? {} : name === "./storage" ? { uploadsRoot: root }
    : name === "./async-cache.mjs" ? { createAsyncCache }
    : name === "./media-scan-limit.mjs" ? { createMediaScanLimit } : require(name);
  new Function("require", "module", "exports", code)(imports, m, m.exports);
  return m.exports;
}

test("pages and blog are listed; unrelated, hidden and symlink entries stay excluded", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-media-scope-"));
  try {
    for (const folder of ["pages/rooms", "blog", "misc", "gallery", "pages/.hidden"]) {
      await mkdir(path.join(root, folder), { recursive: true });
      await writeFile(path.join(root, folder, "image.jpg"), "fixture");
    }
    await symlink(path.join(root, "misc"), path.join(root, "pages", "linked"));
    await symlink(path.join(root, "misc/image.jpg"), path.join(root, "blog", "linked.jpg"));
    const api = library(root);
    const result = await api.readMediaLibrary();
    assert.deepEqual(result.assets.map(asset => asset.url).sort(), ["/uploads/blog/image.jpg", "/uploads/pages/rooms/image.jpg"]);
    assert.equal(result.total, 2);
    await writeFile(path.join(root, "blog", "new.png"), "fixture");
    assert.equal((await api.readMediaLibrary()).total, 2);
    api.invalidateMediaLibrary();
    assert.equal((await api.readMediaLibrary()).total, 3);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("missing roots are empty; a scope-root symlink is not traversed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-media-empty-"));
  try {
    assert.equal((await library(root).readMediaLibrary()).total, 0);
    await mkdir(path.join(root, "outside"));
    await writeFile(path.join(root, "outside", "image.jpg"), "fixture");
    await symlink(path.join(root, "outside"), path.join(root, "blog"));
    assert.equal((await library(root).readMediaLibrary()).total, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});
