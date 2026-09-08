import assert from "node:assert/strict";
import test from "node:test";
import {
  EditLockError,
  EditLockStore,
  toPublicEditLock,
} from "./edit-lock-store.mjs";

function createStore() {
  let currentTime = 1_000;
  let tokenIndex = 0;
  const store = new EditLockStore({
    ttlMs: 90_000,
    now: () => currentTime,
    createToken: () => `token-${++tokenIndex}`,
  });

  return {
    store,
    advanceTime(milliseconds) {
      currentTime += milliseconds;
    },
  };
}

const ayse = { userId: "user-1", username: "ayse", displayName: "Ayşe" };
const mehmet = { userId: "user-2", username: "mehmet", displayName: "Mehmet" };

test("ilk kullanıcı kilidi alır ve diğer kullanıcı engellenir", () => {
  const { store } = createStore();
  const lock = store.acquire("page:1", ayse, { clientId: "tab-a" });

  assert.equal(lock.token, "token-1");
  assert.throws(
    () => store.acquire("page:1", mehmet, { clientId: "tab-b" }),
    (error) => error instanceof EditLockError && error.lock === lock
  );
});

test("aynı kullanıcının farklı sekmesini de ikinci düzenleyici olarak kabul eder", () => {
  const { store } = createStore();
  store.acquire("page:1", ayse, { clientId: "tab-a" });

  assert.throws(
    () => store.acquire("page:1", ayse, { clientId: "tab-b" }),
    EditLockError
  );
});

test("heartbeat kilidin süresini uzatır", () => {
  const { store, advanceTime } = createStore();
  const lock = store.acquire("page:1", ayse, { clientId: "tab-a" });
  advanceTime(30_000);

  const refreshed = store.heartbeat("page:1", ayse.userId, lock.token);
  assert.equal(refreshed.expiresAt, 121_000);
});

test("süresi dolan kilit otomatik temizlenir ve başka kullanıcı alabilir", () => {
  const { store, advanceTime } = createStore();
  store.acquire("page:1", ayse, { clientId: "tab-a" });
  advanceTime(90_001);

  const lock = store.acquire("page:1", mehmet, { clientId: "tab-b" });
  assert.equal(lock.userId, mehmet.userId);
});

test("yalnızca doğru kullanıcı ve token kilidi doğrular veya bırakır", () => {
  const { store } = createStore();
  const lock = store.acquire("page:1", ayse, { clientId: "tab-a" });

  assert.equal(store.assertOwned("page:1", ayse.userId, lock.token), lock);
  assert.throws(() => store.release("page:1", mehmet.userId, lock.token), EditLockError);
  assert.throws(() => store.release("page:1", ayse.userId, "wrong"), EditLockError);
  assert.equal(store.release("page:1", ayse.userId, lock.token), true);
  assert.equal(store.get("page:1"), null);
});

test("zorla devralma eski tokenı geçersiz kılar", () => {
  const { store } = createStore();
  const oldLock = store.acquire("page:1", ayse, { clientId: "tab-a" });
  const newLock = store.acquire("page:1", mehmet, {
    clientId: "tab-b",
    force: true,
  });

  assert.notEqual(newLock.token, oldLock.token);
  assert.throws(
    () => store.heartbeat("page:1", ayse.userId, oldLock.token),
    EditLockError
  );
});

test("public kilit bilgisi token ve kullanıcı kimliği içermez", () => {
  const { store } = createStore();
  const lock = store.acquire("page:1", ayse, { clientId: "tab-a" });
  const publicLock = toPublicEditLock(lock, ayse.userId);

  assert.deepEqual(Object.keys(publicLock).sort(), [
    "acquiredAt",
    "displayName",
    "expiresAt",
    "ownedByCurrentUser",
  ]);
  assert.equal(publicLock.ownedByCurrentUser, true);
});
