export function createAsyncCache({ load, ttlMs, now = Date.now }) {
  if (typeof load !== "function") {
    throw new TypeError("Cache yükleyicisi bir fonksiyon olmalıdır.");
  }

  if (!Number.isSafeInteger(ttlMs) || ttlMs < 0) {
    throw new TypeError("Cache süresi sıfır veya pozitif bir tam sayı olmalıdır.");
  }

  let cachedValue;
  let expiresAt = 0;
  let pendingLoad = null;
  let revision = 0;

  async function loadCurrentRevision() {
    while (true) {
      const revisionAtStart = revision;
      const value = await load();

      if (revisionAtStart === revision) {
        cachedValue = value;
        expiresAt = now() + ttlMs;
        return value;
      }
    }
  }

  async function get() {
    if (cachedValue !== undefined && now() < expiresAt) {
      return cachedValue;
    }

    if (!pendingLoad) {
      pendingLoad = loadCurrentRevision().finally(() => {
        pendingLoad = null;
      });
    }

    return pendingLoad;
  }

  function invalidate() {
    revision += 1;
    cachedValue = undefined;
    expiresAt = 0;
  }

  return Object.freeze({ get, invalidate });
}
