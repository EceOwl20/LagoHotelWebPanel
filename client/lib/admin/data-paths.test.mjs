import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolvePanelDataPaths } from "./data-paths.mjs";

test("ortam değişkeni yoksa mevcut proje dizinlerini kullanır", () => {
  const appRoot = path.resolve("/srv/lago/current/client");
  const paths = resolvePanelDataPaths({ appRoot });

  assert.equal(paths.usesPersistentDataRoot, false);
  assert.equal(paths.dataRoot, null);
  assert.equal(paths.contentRoot, path.join(appRoot, "content"));
  assert.equal(paths.messagesRoot, path.join(appRoot, "messages"));
  assert.equal(paths.publicRoot, path.join(appRoot, "public"));
  assert.equal(paths.uploadsRoot, path.join(appRoot, "public", "uploads"));
});

test("PANEL_DATA_ROOT content ve messages dizinlerini kalıcı köke yönlendirir", () => {
  const appRoot = path.resolve("/srv/lago/current/client");
  const dataRoot = path.resolve("/var/lib/lago-panel");
  const paths = resolvePanelDataPaths({ appRoot, dataRoot });

  assert.equal(paths.usesPersistentDataRoot, true);
  assert.equal(paths.dataRoot, dataRoot);
  assert.equal(paths.contentRoot, path.join(dataRoot, "content"));
  assert.equal(paths.messagesRoot, path.join(dataRoot, "messages"));
  assert.equal(paths.uploadsRoot, path.join(appRoot, "public", "uploads"));
});

test("boş PANEL_DATA_ROOT değeri mevcut proje davranışını korur", () => {
  const appRoot = path.resolve("/srv/lago/current/client");
  const paths = resolvePanelDataPaths({ appRoot, dataRoot: "   " });

  assert.equal(paths.usesPersistentDataRoot, false);
  assert.equal(paths.contentRoot, path.join(appRoot, "content"));
});

test("göreceli PANEL_DATA_ROOT belirsiz sunucu yollarını önlemek için reddedilir", () => {
  assert.throws(
    () =>
      resolvePanelDataPaths({
        appRoot: "/srv/lago/current/client",
        dataRoot: "../panel-data",
      }),
    /PANEL_DATA_ROOT mutlak bir dosya yolu olmalıdır/
  );
});
