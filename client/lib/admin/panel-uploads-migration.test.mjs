import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  applyInitialPanelUploadsMigration,
  inspectInitialPanelUploadsMigration,
} from "./panel-uploads-migration.mjs";

async function createFixture() {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "lago-panel-uploads-")
  );
  const appRoot = path.join(temporaryRoot, "release", "client");
  const sourceRoot = path.join(appRoot, "public", "uploads");
  const uploadsRoot = path.join(temporaryRoot, "persistent", "uploads");

  await mkdir(path.join(sourceRoot, "gallery", "general"), { recursive: true });
  await mkdir(path.join(sourceRoot, "pages"), { recursive: true });
  await writeFile(
    path.join(sourceRoot, "gallery", "general", "hotel.webp"),
    "gallery-image"
  );
  await writeFile(path.join(sourceRoot, "pages", "hero.jpg"), "page-image");

  return { temporaryRoot, appRoot, uploadsRoot };
}

test("ön izleme kalıcı uploads hedefine yazmadan dosyaları sayar", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.temporaryRoot, { recursive: true, force: true }));

  const plan = await inspectInitialPanelUploadsMigration(fixture);

  assert.equal(plan.summary.fileCount, 2);
  assert.equal(plan.summary.totalBytes, 23);
  await assert.rejects(readFile(path.join(fixture.uploadsRoot, "pages", "hero.jpg")));
});

test("uygulama uploads alt klasörlerini kalıcı dizine eksiksiz kopyalar", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.temporaryRoot, { recursive: true, force: true }));

  const plan = await applyInitialPanelUploadsMigration(fixture);

  assert.equal(plan.summary.fileCount, 2);
  assert.equal(
    await readFile(
      path.join(fixture.uploadsRoot, "gallery", "general", "hotel.webp"),
      "utf8"
    ),
    "gallery-image"
  );
  assert.equal(
    await readFile(path.join(fixture.uploadsRoot, "pages", "hero.jpg"), "utf8"),
    "page-image"
  );
});

test("dolu kalıcı uploads hedefinin üzerine yazmaz", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.temporaryRoot, { recursive: true, force: true }));
  await mkdir(fixture.uploadsRoot, { recursive: true });
  await writeFile(path.join(fixture.uploadsRoot, "existing.webp"), "keep-me");

  await assert.rejects(
    applyInitialPanelUploadsMigration(fixture),
    /Hedef uploads dizini boş değil/
  );
  assert.equal(
    await readFile(path.join(fixture.uploadsRoot, "existing.webp"), "utf8"),
    "keep-me"
  );
});

test("kalıcı uploads hedefinin release içinde olmasını reddeder", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.temporaryRoot, { recursive: true, force: true }));

  await assert.rejects(
    inspectInitialPanelUploadsMigration({
      appRoot: fixture.appRoot,
      uploadsRoot: path.join(fixture.appRoot, "persistent-uploads"),
    }),
    /proje dizininin dışında/
  );
});
