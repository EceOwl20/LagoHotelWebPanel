import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { hashAdminPassword, verifyAdminPassword } from "./password.mjs";
import { isPanelRole } from "./permissions.mjs";
import { contentRoot, readJson, writeJson } from "./storage";
import { enqueueFileOperation } from "./file-operation-queue.mjs";
import {
  normalizePanelUsername,
  normalizePanelUserInput,
  PANEL_USERNAME_PATTERN,
} from "./user-policy.mjs";

const usersFilePath = process.env.PANEL_USERS_FILE_PATH
  ? path.resolve(process.env.PANEL_USERS_FILE_PATH)
  : path.join(contentRoot, "admin", "users.json");

export class PanelUserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PanelUserError";
    this.status = status;
  }
}

function normalizeStoredUser(user) {
  if (
    !user?.id ||
    !PANEL_USERNAME_PATTERN.test(user.username || "") ||
    !user.passwordHash?.startsWith("scrypt:") ||
    !isPanelRole(user.role)
  ) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: String(user.displayName || user.username).slice(0, 100),
    passwordHash: user.passwordHash,
    role: user.role,
    active: user.active !== false,
    sessionVersion: Number.isInteger(user.sessionVersion) ? user.sessionVersion : 1,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

async function readUserStore() {
  const stored = await readJson(usersFilePath, { schemaVersion: 1, users: [] });
  const users = Array.isArray(stored?.users)
    ? stored.users.map(normalizeStoredUser).filter(Boolean)
    : [];

  return { schemaVersion: 1, users };
}

function toPublicUser(user) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

function validateUserInput(input, { passwordRequired }) {
  const normalized = normalizePanelUserInput(input, { passwordRequired });
  if (normalized.errors.length > 0) throw new PanelUserError(normalized.errors[0]);
  return normalized.value;
}

export async function listPanelUsers() {
  const store = await readUserStore();
  return store.users.map(toPublicUser).sort((left, right) =>
    left.username.localeCompare(right.username, "tr")
  );
}

export async function findPanelUserById(id) {
  const store = await readUserStore();
  return store.users.find((user) => user.id === id) || null;
}

export async function authenticatePanelUser(username, password) {
  const normalizedUsername = normalizePanelUsername(username);
  const store = await readUserStore();
  const user = store.users.find((candidate) => candidate.username === normalizedUsername);

  if (!user || !user.active || !verifyAdminPassword(password, user.passwordHash)) {
    return null;
  }

  return toPublicUser(user);
}

async function createPanelUserUnlocked(input, reservedUsernames = []) {
  const normalized = validateUserInput(input, { passwordRequired: true });
  const store = await readUserStore();

  if (
    reservedUsernames.map(normalizePanelUsername).includes(normalized.username) ||
    store.users.some((user) => user.username === normalized.username)
  ) {
    throw new PanelUserError("Bu kullanıcı adı zaten kullanılıyor.", 409);
  }

  const timestamp = new Date().toISOString();
  const user = {
    id: randomUUID(),
    username: normalized.username,
    displayName: normalized.displayName,
    passwordHash: hashAdminPassword(normalized.password),
    role: normalized.role,
    active: true,
    sessionVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.users.push(user);
  await writeJson(usersFilePath, store);
  return toPublicUser(user);
}

export function createPanelUser(input, reservedUsernames = []) {
  return enqueueFileOperation(path.dirname(usersFilePath), () =>
    createPanelUserUnlocked(input, reservedUsernames)
  );
}

async function updatePanelUserUnlocked(id, input, currentUserId, reservedUsernames = []) {
  const store = await readUserStore();
  const userIndex = store.users.findIndex((user) => user.id === id);

  if (userIndex < 0) {
    throw new PanelUserError("Kullanıcı bulunamadı.", 404);
  }

  const current = store.users[userIndex];
  const normalized = validateUserInput(
    {
      username: input?.username ?? current.username,
      displayName: input?.displayName ?? current.displayName,
      role: input?.role ?? current.role,
      password: input?.password || "",
    },
    { passwordRequired: false }
  );
  const active = input?.active === undefined ? current.active : input.active === true;

  if (
    reservedUsernames.map(normalizePanelUsername).includes(normalized.username) ||
    store.users.some(
      (user, index) => index !== userIndex && user.username === normalized.username
    )
  ) {
    throw new PanelUserError("Bu kullanıcı adı zaten kullanılıyor.", 409);
  }

  if (id === currentUserId && (!active || normalized.role !== "admin")) {
    throw new PanelUserError("Kendi yönetici hesabınızı pasifleştiremez veya rolünü düşüremezsiniz.");
  }

  const remainingActiveAdmins = store.users.filter(
    (user, index) =>
      index !== userIndex && user.active && user.role === "admin"
  ).length;

  if (current.active && current.role === "admin" && (!active || normalized.role !== "admin") && remainingActiveAdmins === 0) {
    throw new PanelUserError("Son aktif yönetici hesabı pasifleştirilemez.");
  }

  const securityChanged =
    normalized.role !== current.role || active !== current.active || Boolean(normalized.password);
  const updated = {
    ...current,
    username: normalized.username,
    displayName: normalized.displayName,
    role: normalized.role,
    active,
    passwordHash: normalized.password
      ? hashAdminPassword(normalized.password)
      : current.passwordHash,
    sessionVersion: securityChanged ? current.sessionVersion + 1 : current.sessionVersion,
    updatedAt: new Date().toISOString(),
  };

  store.users[userIndex] = updated;
  await writeJson(usersFilePath, store);
  return toPublicUser(updated);
}

export function updatePanelUser(id, input, currentUserId, reservedUsernames = []) {
  return enqueueFileOperation(path.dirname(usersFilePath), () =>
    updatePanelUserUnlocked(id, input, currentUserId, reservedUsernames)
  );
}
