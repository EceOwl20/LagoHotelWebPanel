import "server-only";

import { EditLockStore, toPublicEditLock } from "./edit-lock-store.mjs";

const editLockStoreKey = Symbol.for("lago.admin.edit-lock-store");
const editLockStore = globalThis[editLockStoreKey] || new EditLockStore();
globalThis[editLockStoreKey] = editLockStore;

function getPageResourceKey(pageId) {
  return `dynamic-page:${pageId}`;
}

function getBlogResourceKey(slug) {
  return `blog:${slug}`;
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

export function acquireBlogEditLock(slug, session, options) {
  return editLockStore.acquire(getBlogResourceKey(slug), session, options);
}

export function heartbeatBlogEditLock(slug, session, token) {
  return editLockStore.heartbeat(getBlogResourceKey(slug), session.userId, token);
}

export function assertBlogEditLock(slug, session, token) {
  return editLockStore.assertOwned(getBlogResourceKey(slug), session.userId, token);
}

export function assertBlogNotLockedByAnother(slug, session) {
  return editLockStore.assertNotOwnedByAnother(
    getBlogResourceKey(slug),
    session.userId
  );
}

export function releaseBlogEditLock(slug, session, token) {
  return editLockStore.release(getBlogResourceKey(slug), session.userId, token);
}

export function clearBlogEditLock(slug) {
  return editLockStore.clear(getBlogResourceKey(slug));
}

export function serializeBlogEditLock(lock, session) {
  return toPublicEditLock(lock, session.userId);
}

export function acquireContentEditLock(resourceKey, session, options) {
  return editLockStore.acquire(resourceKey, session, options);
}

export function heartbeatContentEditLock(resourceKey, session, token) {
  return editLockStore.heartbeat(
    resourceKey,
    session.userId,
    token
  );
}

export function assertContentEditLock(resourceKey, session, token) {
  return editLockStore.assertOwned(
    resourceKey,
    session.userId,
    token
  );
}

export function releaseContentEditLock(resourceKey, session, token) {
  return editLockStore.release(
    resourceKey,
    session.userId,
    token
  );
}

export function serializeContentEditLock(lock, session) {
  return toPublicEditLock(lock, session.userId);
}
