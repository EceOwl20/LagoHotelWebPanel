import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { writeFileAtomically } from "./atomic-file.mjs";

const temporaryDirectories = [];

async function createTestDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "lago-atomic-write-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

test("yeni içerik tamamlandıktan sonra asıl dosyanın yerine geçirilir", async () => {
  const directory = await createTestDirectory();
  const filePath = path.join(directory, "content.json");
  await writeFile(filePath, '{"version":"old"}\n', "utf8");

  await writeFileAtomically(filePath, '{"version":"new"}\n', "utf8");

  assert.equal(await readFile(filePath, "utf8"), '{"version":"new"}\n');
  assert.deepEqual(await readdir(directory), ["content.json"]);
});

test("geçici dosya yazılamazsa mevcut dosya korunur", async () => {
  const directory = await createTestDirectory();
  const filePath = path.join(directory, "content.json");
  const originalContent = '{"version":"safe"}\n';
  await writeFile(filePath, originalContent, "utf8");

  await assert.rejects(
    writeFileAtomically(filePath, { unsupported: true }, "utf8"),
    /data.*string|instance of Buffer|TypedArray|DataView/i
  );

  assert.equal(await readFile(filePath, "utf8"), originalContent);
  assert.deepEqual(await readdir(directory), ["content.json"]);
});

test("eşzamanlı yazmalarda yarım JSON veya geçici dosya bırakılmaz", async () => {
  const directory = await createTestDirectory();
  const filePath = path.join(directory, "content.json");
  const payloads = Array.from({ length: 20 }, (_, index) =>
    `${JSON.stringify({ index, content: "x".repeat(2_000) })}\n`
  );

  await Promise.all(
    payloads.map((payload) => writeFileAtomically(filePath, payload, "utf8"))
  );

  const finalContent = await readFile(filePath, "utf8");
  assert.ok(payloads.includes(finalContent));
  assert.doesNotThrow(() => JSON.parse(finalContent));
  assert.deepEqual(await readdir(directory), ["content.json"]);
});
