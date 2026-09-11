import assert from "node:assert/strict";
import test from "node:test";
import {
  createPageHistoryDetail,
  createPageHistorySummary,
  DEFAULT_PAGE_HISTORY_LIMIT,
  hasMeaningfulDraftChange,
  normalizePageHistory,
  prependPageHistorySnapshot,
  resolvePageHistoryLimit,
} from "./page-history.mjs";

function createRecord(title = "İlk başlık", history = []) {
  return {
    storageVersion: 2,
    id: "page-id",
    published: null,
    history,
    draft: {
      id: "page-id",
      status: "draft",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
      hero: { translations: { tr: { title } } },
    },
  };
}

test("sayfa geçmişi deneme sürümünde varsayılan olarak üç kayıt tutar", () => {
  assert.equal(resolvePageHistoryLimit({}), DEFAULT_PAGE_HISTORY_LIMIT);
  assert.equal(DEFAULT_PAGE_HISTORY_LIMIT, 3);
  assert.equal(
    resolvePageHistoryLimit({ PANEL_PAGE_VERSION_LIMIT: "10" }),
    10
  );
});

test("geçersiz geçmiş limitini kayıt işleminden önce reddeder", () => {
  for (const value of ["0", "1.5", "101", "geçersiz"]) {
    assert.throws(
      () => resolvePageHistoryLimit({ PANEL_PAGE_VERSION_LIMIT: value }),
      /PANEL_PAGE_VERSION_LIMIT/
    );
  }
});

test("yalnızca zaman alanı değiştiğinde gereksiz sürüm oluşturulmasını önler", () => {
  const previousDraft = createRecord().draft;
  const timestampOnlyChange = {
    ...previousDraft,
    updatedAt: "2026-01-01T11:00:00.000Z",
  };
  const contentChange = {
    ...timestampOnlyChange,
    hero: { translations: { tr: { title: "Yeni başlık" } } },
  };

  assert.equal(hasMeaningfulDraftChange(previousDraft, timestampOnlyChange), false);
  assert.equal(hasMeaningfulDraftChange(previousDraft, contentChange), true);
});

test("eski taslağı kullanıcı bilgisiyle kaydeder ve en yeni üç sürümü korur", () => {
  let record = createRecord("Birinci");

  for (let index = 1; index <= 4; index += 1) {
    record = prependPageHistorySnapshot(record, {
      versionId: `version-${index}`,
      createdAt: `2026-01-0${index}T10:00:00.000Z`,
      createdBy: {
        id: "admin-id",
        username: "admin",
        displayName: "Yönetici",
        role: "admin",
      },
      limit: 3,
    });
    record = {
      ...record,
      draft: {
        ...record.draft,
        hero: { translations: { tr: { title: `Başlık ${index}` } } },
      },
    };
  }

  assert.deepEqual(
    record.history.map((entry) => entry.versionId),
    ["version-4", "version-3", "version-2"]
  );
  assert.equal(
    record.history[0].draft.hero.translations.tr.title,
    "Başlık 3"
  );
  assert.equal(record.history[0].createdBy.displayName, "Yönetici");
});

test("bozuk geçmiş girdilerini okuma sırasında güvenle yok sayar", () => {
  const normalized = normalizePageHistory([
    null,
    { versionId: "missing-draft", createdAt: "2026-01-01T10:00:00.000Z" },
    {
      versionId: "valid",
      createdAt: "2026-01-01T10:00:00.000Z",
      draft: createRecord().draft,
    },
  ]);

  assert.deepEqual(normalized.map((entry) => entry.versionId), ["valid"]);
});

test("geçmiş listesi tam taslak yerine güvenli bir özet üretir", () => {
  const record = prependPageHistorySnapshot(createRecord("Önceki başlık"), {
    versionId: "version-summary",
    createdAt: "2026-01-02T10:00:00.000Z",
    createdBy: {
      id: "gizli-olmayan-ama-gereksiz-id",
      username: "editor",
      displayName: "İçerik Editörü",
      role: "editor",
    },
    limit: 3,
  });
  record.history[0].draft.slugs = { tr: "onceki-sayfa" };
  record.history[0].draft.sections = [{ id: "one" }, { id: "two" }];

  const summary = createPageHistorySummary(record.history[0]);

  assert.deepEqual(summary, {
    versionId: "version-summary",
    createdAt: "2026-01-02T10:00:00.000Z",
    action: "draft-save",
    createdBy: {
      username: "editor",
      displayName: "İçerik Editörü",
      role: "editor",
    },
    wasPublished: false,
    title: "Önceki başlık",
    slugs: { tr: "onceki-sayfa" },
    componentCount: 2,
  });
  assert.equal("draft" in summary, false);
  assert.equal("id" in summary.createdBy, false);
});

test("geçmiş detayı ön izleme için bağımsız taslak kopyası üretir", () => {
  const record = prependPageHistorySnapshot(createRecord("Detay başlığı"), {
    versionId: "version-detail",
    createdAt: "2026-01-02T10:00:00.000Z",
    createdBy: { username: "admin", displayName: "Yönetici", role: "admin" },
    limit: 3,
  });
  const sourceEntry = record.history[0];
  const detail = createPageHistoryDetail(sourceEntry);

  assert.equal(detail.versionId, "version-detail");
  assert.equal(detail.title, "Detay başlığı");
  assert.equal(detail.draft.hero.translations.tr.title, "Detay başlığı");
  assert.notEqual(detail.draft, sourceEntry.draft);

  detail.draft.hero.translations.tr.title = "Ön izlemede değiştirildi";
  assert.equal(
    sourceEntry.draft.hero.translations.tr.title,
    "Detay başlığı"
  );
});
