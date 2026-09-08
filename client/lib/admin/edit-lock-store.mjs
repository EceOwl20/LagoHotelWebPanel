import { randomUUID } from "node:crypto";

export const DEFAULT_EDIT_LOCK_TTL_MS = 90_000;

export class EditLockError extends Error {
  constructor(message, lock = null, status = 409) {
    super(message);
    this.name = "EditLockError";
    this.lock = lock;
    this.status = status;
  }
}

export class EditLockStore {
  constructor({ ttlMs = DEFAULT_EDIT_LOCK_TTL_MS, now = Date.now, createToken = randomUUID } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.createToken = createToken;
    this.locks = new Map();
  }

  get(resourceKey) {
    const lock = this.locks.get(resourceKey) || null;

    if (lock && lock.expiresAt <= this.now()) {
      this.locks.delete(resourceKey);
      return null;
    }

    return lock;
  }

  acquire(resourceKey, owner, { clientId, force = false } = {}) {
    const current = this.get(resourceKey);
    const timestamp = this.now();

    if (
      current &&
      current.userId === owner.userId &&
      current.clientId === clientId
    ) {
      current.refreshedAt = timestamp;
      current.expiresAt = timestamp + this.ttlMs;
      return current;
    }

    if (current && !force) {
      throw new EditLockError(
        `Bu içerik şu anda ${current.displayName} tarafından düzenleniyor.`,
        current
      );
    }

    const lock = {
      resourceKey,
      token: this.createToken(),
      clientId,
      userId: owner.userId,
      username: owner.username,
      displayName: owner.displayName || owner.username,
      acquiredAt: timestamp,
      refreshedAt: timestamp,
      expiresAt: timestamp + this.ttlMs,
    };
    this.locks.set(resourceKey, lock);
    return lock;
  }

  heartbeat(resourceKey, userId, token) {
    const current = this.assertOwned(resourceKey, userId, token);
    const timestamp = this.now();
    current.refreshedAt = timestamp;
    current.expiresAt = timestamp + this.ttlMs;
    return current;
  }

  assertOwned(resourceKey, userId, token) {
    const current = this.get(resourceKey);

    if (!current) {
      throw new EditLockError(
        "Düzenleme kilidi bulunamadı veya süresi doldu. Sayfayı yenileyin."
      );
    }

    if (!token || current.token !== token || current.userId !== userId) {
      throw new EditLockError(
        `Bu içerik şu anda ${current.displayName} tarafından düzenleniyor.`,
        current
      );
    }

    return current;
  }

  assertNotOwnedByAnother(resourceKey, userId) {
    const current = this.get(resourceKey);

    if (current && current.userId !== userId) {
      throw new EditLockError(
        `Bu içerik şu anda ${current.displayName} tarafından düzenleniyor.`,
        current
      );
    }

    return current;
  }

  release(resourceKey, userId, token) {
    const current = this.get(resourceKey);
    if (!current) return false;

    if (!token || current.token !== token || current.userId !== userId) {
      throw new EditLockError(
        `Bu içerik şu anda ${current.displayName} tarafından düzenleniyor.`,
        current
      );
    }

    this.locks.delete(resourceKey);
    return true;
  }

  clear(resourceKey) {
    return this.locks.delete(resourceKey);
  }
}

export function toPublicEditLock(lock, currentUserId = null) {
  if (!lock) return null;

  return {
    displayName: lock.displayName,
    acquiredAt: new Date(lock.acquiredAt).toISOString(),
    expiresAt: new Date(lock.expiresAt).toISOString(),
    ownedByCurrentUser: lock.userId === currentUserId,
  };
}
