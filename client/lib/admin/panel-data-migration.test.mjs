import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyInitialPanelDataMigration,
  inspectInitialPanelDataMigration,
} from "./panel-data-migration.mjs";

async function createFixture() {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "lago-panel-data-"));
  const appRoot = path.join(fixtureRoot, "release", "client");
  const dataRoot = path.join(fixtureRoot, "persistent", "panel-data");

  await mkdir(path.join(appRoot, "content", "pages"), { recursive: true });
  await mkdir(path.join(appRoot, "messages"), { recursive: true });
  await writeFile(path.join(appRoot, "content", "pages", "page.json"), "{}\n");
  await writeFile(path.join(appRoot, "messages", "tr.json"), '{"title":"Lago"}\n');

  return { fixtureRoot, appRoot, dataRoot };
}

test("ön izleme hedefe yazmadan kaynak dosyaları sayar", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.fixtureRoot, { recursive: true, force: true }));

  const plan = await inspectInitialPanelDataMigration(fixture);

  assert.equal(plan.targetExists, false);
  assert.equal(plan.directorySummaries.content.fileCount, 1);
  assert.equal(plan.directorySummaries.messages.fileCount, 1);
  await assert.rejects(readFile(path.join(fixture.dataRoot, "messages", "tr.json")));
});

test("uygulama content ve messages klasörlerini birlikte kalıcı dizine kopyalar", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.fixtureRoot, { recursive: true, force: true }));

  await applyInitialPanelDataMigration(fixture);

  assert.equal(
    await readFile(path.join(fixture.dataRoot, "content", "pages", "page.json"), "utf8"),
    "{}\n"
  );
  assert.equal(
    await readFile(path.join(fixture.dataRoot, "messages", "tr.json"), "utf8"),
    '{"title":"Lago"}\n'
  );
});

test("dolu hedef dizindeki mevcut verilerin üzerine yazmaz", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.fixtureRoot, { recursive: true, force: true }));

  await mkdir(fixture.dataRoot, { recursive: true });
  await writeFile(path.join(fixture.dataRoot, "existing.json"), "{}\n");

  await assert.rejects(
    inspectInitialPanelDataMigration(fixture),
    /Hedef dizin boş değil/
  );
});

test("kalıcı hedefin release klasörü içine verilmesini reddeder", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.fixtureRoot, { recursive: true, force: true }));

  await assert.rejects(
    inspectInitialPanelDataMigration({
      appRoot: fixture.appRoot,
      dataRoot: path.join(fixture.appRoot, "persistent"),
    }),
    /proje dizininin dışında/
  );
});
