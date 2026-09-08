import "server-only";

import { EditLockStore, toPublicEditLock } from "./edit-lock-store.mjs";

const editLockStoreKey = Symbol.for("lago.admin.edit-lock-store");
const editLockStore = globalThis[editLockStoreKey] || new EditLockStore();
globalThis[editLockStoreKey] = editLockStore;

function getPageResourceKey(pageId) {
  return `dynamic-page:${pageId}`;
}

export function acquirePageEditLock(pageId, session, options) {
  return editLockStore.acquire(getPageResourceKey(pageId), session, options);
}

export function heartbeatPageEditLock(pageId, session, token) {
  return editLockStore.heartbeat(getPageResourceKey(pageId), session.userId, token);
}

export function assertPageEditLock(pageId, session, token) {
  return editLockStore.assertOwned(getPageResourceKey(pageId), session.userId, token);
}

export function assertPageNotLockedByAnother(pageId, session) {
  return editLockStore.assertNotOwnedByAnother(
    getPageResourceKey(pageId),
    session.userId
  );
}

export function releasePageEditLock(pageId, session, token) {
  return editLockStore.release(getPageResourceKey(pageId), session.userId, token);
}

export function clearPageEditLock(pageId) {
  return editLockStore.clear(getPageResourceKey(pageId));
}

export function serializePageEditLock(lock, session) {
  return toPublicEditLock(lock, session.userId);
}
