export const DEFAULT_TRASH_RETENTION_DAYS = 90;
export const DEFAULT_TRASH_MIN_ITEMS = 20;

function parseIntegerSetting(value, { name, defaultValue, minimum, maximum }) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) return defaultValue;

  const parsedValue = Number(normalizedValue);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < minimum ||
    parsedValue > maximum
  ) {
    throw new Error(
      `${name} ${minimum} ile ${maximum} arasında bir tam sayı olmalıdır.`
    );
  }

  return parsedValue;
}

export function resolveTrashRetentionPolicy(environment = process.env) {
  return Object.freeze({
    retentionDays: parseIntegerSetting(environment.PANEL_TRASH_RETENTION_DAYS, {
      name: "PANEL_TRASH_RETENTION_DAYS",
      defaultValue: DEFAULT_TRASH_RETENTION_DAYS,
      minimum: 1,
      maximum: 3650,
    }),
    minimumItems: parseIntegerSetting(environment.PANEL_TRASH_MIN_ITEMS, {
      name: "PANEL_TRASH_MIN_ITEMS",
      defaultValue: DEFAULT_TRASH_MIN_ITEMS,
      minimum: 0,
      maximum: 100000,
    }),
  });
}

function normalizeCleanupEntry(entry) {
  const deletedAt = entry?.metadata?.deletedAt;
  const deletedAtTimestamp = Date.parse(deletedAt);
  const hasMatchingMetadata =
    entry?.metadata?.resourceType === "dynamic-page" &&
    entry.metadata.resourceId === entry.entryId;

  if (
    !entry?.resource ||
    !hasMatchingMetadata ||
    !deletedAt ||
    Number.isNaN(deletedAtTimestamp)
  ) {
    return null;
  }

  return {
    entryId: entry.entryId,
    deletedAt,
    deletedAtTimestamp,
  };
}

export function planTrashedPageCleanup(
  entries,
  { now = new Date(), retentionDays, minimumItems }
) {
  const nowTimestamp = new Date(now).getTime();

  if (Number.isNaN(nowTimestamp)) {
    throw new Error("Temizlik zamanı geçerli bir tarih olmalıdır.");
  }

  if (!Number.isSafeInteger(retentionDays) || retentionDays < 1) {
    throw new Error("Saklama süresi en az 1 gün olmalıdır.");
  }

  if (!Number.isSafeInteger(minimumItems) || minimumItems < 0) {
    throw new Error("Korunacak kayıt sayısı negatif olamaz.");
  }

  const normalizedEntries = [];
  const skippedEntries = [];

  for (const entry of Array.isArray(entries) ? entries : []) {
    const normalizedEntry = normalizeCleanupEntry(entry);

    if (normalizedEntry) {
      normalizedEntries.push(normalizedEntry);
    } else {
      skippedEntries.push(entry?.entryId || "bilinmeyen-kayıt");
    }
  }

  normalizedEntries.sort(
    (left, right) =>
      right.deletedAtTimestamp - left.deletedAtTimestamp ||
      left.entryId.localeCompare(right.entryId)
  );

  const cutoffTimestamp =
    nowTimestamp - retentionDays * 24 * 60 * 60 * 1000;
  const protectedEntries = normalizedEntries.slice(0, minimumItems);
  const remainingEntries = normalizedEntries.slice(minimumItems);
  const candidates = remainingEntries.filter(
    (entry) => entry.deletedAtTimestamp <= cutoffTimestamp
  );

  return {
    now: new Date(nowTimestamp).toISOString(),
    cutoff: new Date(cutoffTimestamp).toISOString(),
    retentionDays,
    minimumItems,
    totalEntries: normalizedEntries.length + skippedEntries.length,
    validEntries: normalizedEntries.length,
    protectedEntries,
    retainedByAge: remainingEntries.filter(
      (entry) => entry.deletedAtTimestamp > cutoffTimestamp
    ),
    candidates,
    skippedEntries,
  };
}
