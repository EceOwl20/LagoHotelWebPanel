import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(clientRoot, "node_modules", "next", "dist", "bin", "next");
const adminUsername = "integration-admin";
const adminPassword = "IntegrationAdminPassword!2026";
const editorUsername = "integration-editor";
const editorPassword = "IntegrationEditorPassword!2026";
const replacementPassword = "ReplacementEditorPassword!2026";
const concurrentUsernames = ["concurrent-editor-a", "concurrent-editor-b"];

let serverProcess;
let serverOrigin;
let temporaryRoot;
let usersFilePath;
let serverOutput = "";
let adminCookie;
let editorCookie;
let editorId;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Test sunucusu erken kapandı.\n${serverOutput}`);
    }

    try {
      await fetch(`${serverOrigin}/api/admin/session`, { cache: "no-store" });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error(`Test sunucusu zamanında başlamadı.\n${serverOutput}`);
}

function rememberServerOutput(chunk) {
  serverOutput = `${serverOutput}${chunk}`.slice(-12_000);
}

async function request(pathname, { cookie, origin = serverOrigin, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set("cookie", cookie);
  if (origin) headers.set("origin", origin);

  return fetch(`${serverOrigin}${pathname}`, {
    redirect: "manual",
    ...options,
    headers,
  });
}

async function login(username, password) {
  const response = await request("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json();
  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0] || "";
  return { response, payload, cookie };
}

before(async () => {
  temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "lago-panel-users-"));
  usersFilePath = path.join(temporaryRoot, "users.json");
  const port = await getFreePort();
  serverOrigin = `http://127.0.0.1:${port}`;
  serverProcess = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: clientRoot,
      env: {
        ...process.env,
        ADMIN_USERNAME: adminUsername,
        ADMIN_PASSWORD: adminPassword,
        ADMIN_PASSWORD_HASH: "",
        ADMIN_SESSION_SECRET: "integration-test-session-secret-change-before-production",
        PANEL_USERS_FILE_PATH: usersFilePath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  serverProcess.stdout.on("data", rememberServerOutput);
  serverProcess.stderr.on("data", rememberServerOutput);
  await waitForServer();
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill("SIGTERM");
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 5_000);
      serverProcess.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("oturumsuz kullanıcı yönetimi isteği 401 döner", async () => {
  const response = await request("/api/admin/users", { origin: null });
  assert.equal(response.status, 401);
});

test("hatalı giriş cookie üretmeden 401 döner", async () => {
  const result = await login(adminUsername, "wrong-password");
  assert.equal(result.response.status, 401);
  assert.equal(result.cookie, "");
});

test("sistem yöneticisi admin rolüyle giriş yapar", async () => {
  const result = await login(adminUsername, adminPassword);
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.user.role, "admin");
  assert.ok(result.cookie.startsWith("lago_admin_session="));
  adminCookie = result.cookie;
});

test("farklı origin üzerinden kullanıcı oluşturma isteği 403 döner", async () => {
  const response = await request("/api/admin/users", {
    method: "POST",
    cookie: adminCookie,
    origin: "https://example.invalid",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user: {} }),
  });
  assert.equal(response.status, 403);
});

test("admin editör oluşturur ve parola yalnızca scrypt özeti olarak saklanır", async () => {
  const response = await request("/api/admin/users", {
    method: "POST",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user: {
        username: editorUsername,
        displayName: "Integration Editor",
        password: editorPassword,
        role: "editor",
      },
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.user.role, "editor");
  assert.equal(Object.hasOwn(payload.user, "passwordHash"), false);
  editorId = payload.user.id;

  const stored = JSON.parse(await readFile(usersFilePath, "utf8"));
  assert.equal(stored.users[0].passwordHash.startsWith("scrypt:"), true);
  assert.equal(JSON.stringify(stored).includes(editorPassword), false);
});

test("aynı anda oluşturulan iki kullanıcıdan hiçbiri kaybolmaz", async () => {
  const responses = await Promise.all(
    concurrentUsernames.map((username) =>
      request("/api/admin/users", {
        method: "POST",
        cookie: adminCookie,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user: {
            username,
            displayName: username,
            password: editorPassword,
            role: "editor",
          },
        }),
      })
    )
  );

  assert.deepEqual(responses.map((response) => response.status), [201, 201]);

  const listResponse = await request("/api/admin/users", {
    cookie: adminCookie,
    origin: null,
  });
  const payload = await listResponse.json();
  const storedUsernames = payload.users.map((user) => user.username);

  for (const username of concurrentUsernames) {
    assert.ok(storedUsernames.includes(username));
  }
});

test("aynı kullanıcı adı ve sistem yöneticisi adı tekrar oluşturulamaz", async () => {
  for (const username of [editorUsername, adminUsername]) {
    const response = await request("/api/admin/users", {
      method: "POST",
      cookie: adminCookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user: {
          username,
          displayName: "Duplicate User",
          password: "DuplicatePassword!2026",
          role: "editor",
        },
      }),
    });
    assert.equal(response.status, 409);
  }
});

test("editör giriş yapabilir fakat yönetici endpointlerine erişemez", async () => {
  const loginResult = await login(editorUsername, editorPassword);
  assert.equal(loginResult.response.status, 200);
  assert.equal(loginResult.payload.user.role, "editor");
  editorCookie = loginResult.cookie;

  const deniedRequests = [
    request("/api/admin/users", { cookie: editorCookie, origin: null }),
    request("/api/admin/users", {
      method: "POST",
      cookie: editorCookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: {} }),
    }),
    request("/api/admin/pages/00000000-0000-0000-0000-000000000000", {
      method: "PATCH",
      cookie: editorCookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    }),
    request("/api/admin/pages/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
      cookie: editorCookie,
    }),
    request("/api/admin/gallery?categoryId=test&imageId=test", {
      method: "DELETE",
      cookie: editorCookie,
    }),
    request("/api/admin/blog/posts", {
      method: "POST",
      cookie: editorCookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ post: { status: "published" } }),
    }),
  ];

  const responses = await Promise.all(deniedRequests);
  assert.deepEqual(responses.map((response) => response.status), [403, 403, 403, 403, 403, 403]);
});

test("dinamik sayfa düzenleme kilidi kullanıcıları ve sekmeleri birbirinden ayırır", async () => {
  const pagesResponse = await request("/api/admin/pages", {
    cookie: adminCookie,
    origin: null,
  });
  const pagesPayload = await pagesResponse.json();
  assert.equal(pagesResponse.status, 200);
  assert.ok(pagesPayload.pages.length > 0, "Kilit testi için dinamik sayfa bulunmalı");

  const pageId = pagesPayload.pages[0].id;
  const pageResponse = await request(`/api/admin/pages/${pageId}`, {
    cookie: editorCookie,
    origin: null,
  });
  const pagePayload = await pageResponse.json();
  assert.equal(pageResponse.status, 200);

  const adminAcquire = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "acquire",
      clientId: "11111111-1111-4111-8111-111111111111",
    }),
  });
  const adminLock = await adminAcquire.json();
  assert.equal(adminAcquire.status, 200);
  assert.ok(adminLock.lockToken);

  const editorAcquire = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: editorCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "acquire",
      clientId: "22222222-2222-4222-8222-222222222222",
    }),
  });
  const blockedLock = await editorAcquire.json();
  assert.equal(editorAcquire.status, 409);
  assert.equal(blockedLock.lock.displayName, adminUsername);
  assert.equal(Object.hasOwn(blockedLock.lock, "token"), false);

  const editorTakeover = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: editorCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "takeover",
      clientId: "22222222-2222-4222-8222-222222222222",
    }),
  });
  assert.equal(editorTakeover.status, 403);

  const unlockedUpdate = await request(`/api/admin/pages/${pageId}`, {
    method: "PUT",
    cookie: editorCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ page: pagePayload.page }),
  });
  assert.equal(unlockedUpdate.status, 409);

  const adminRelease = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "release", lockToken: adminLock.lockToken }),
  });
  assert.equal(adminRelease.status, 200);

  const editorAcquireAfterRelease = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: editorCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "acquire",
      clientId: "22222222-2222-4222-8222-222222222222",
    }),
  });
  const editorLock = await editorAcquireAfterRelease.json();
  assert.equal(editorAcquireAfterRelease.status, 200);

  const adminTakeover = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "takeover",
      clientId: "11111111-1111-4111-8111-111111111111",
    }),
  });
  const takeoverLock = await adminTakeover.json();
  assert.equal(adminTakeover.status, 200);

  const staleHeartbeat = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: editorCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "heartbeat", lockToken: editorLock.lockToken }),
  });
  assert.equal(staleHeartbeat.status, 409);

  const takeoverRelease = await request(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "release", lockToken: takeoverLock.lockToken }),
  });
  assert.equal(takeoverRelease.status, 200);
});

test("pasifleştirme kullanıcının açık oturumunu geçersiz kılar", async () => {
  const updateResponse = await request(`/api/admin/users/${editorId}`, {
    method: "PUT",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user: { active: false } }),
  });
  assert.equal(updateResponse.status, 200);

  const sessionResponse = await request("/api/admin/session", {
    cookie: editorCookie,
    origin: null,
  });
  assert.equal(sessionResponse.status, 401);
});

test("parola değişikliği eski cookie ve eski parolayı geçersiz kılar", async () => {
  const reactivateResponse = await request(`/api/admin/users/${editorId}`, {
    method: "PUT",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user: { active: true } }),
  });
  assert.equal(reactivateResponse.status, 200);

  const activeLogin = await login(editorUsername, editorPassword);
  assert.equal(activeLogin.response.status, 200);

  const passwordResponse = await request(`/api/admin/users/${editorId}`, {
    method: "PUT",
    cookie: adminCookie,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user: { password: replacementPassword } }),
  });
  assert.equal(passwordResponse.status, 200);

  const staleSession = await request("/api/admin/session", {
    cookie: activeLogin.cookie,
    origin: null,
  });
  assert.equal(staleSession.status, 401);
  assert.equal((await login(editorUsername, editorPassword)).response.status, 401);
  assert.equal((await login(editorUsername, replacementPassword)).response.status, 200);
});

test("SVG ve PDF dosyaları upload endpointinde reddedilir", async () => {
  const unsafeFiles = [
    {
      name: "unsafe.svg",
      type: "image/svg+xml",
      content: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    },
    {
      name: "document.pdf",
      type: "application/pdf",
      content: "%PDF-1.7 test document",
    },
  ];

  for (const unsafeFile of unsafeFiles) {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([unsafeFile.content], { type: unsafeFile.type }),
      unsafeFile.name
    );
    formData.append("folder", "gallery/general");

    const response = await request("/api/admin/upload", {
      method: "POST",
      cookie: adminCookie,
      body: formData,
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /JPG, PNG, WEBP veya GIF/);
  }
});

test("görsel uzantısı verilmiş sahte veya formatı uyuşmayan dosyalar reddedilir", async () => {
  const invalidImages = [
    {
      name: "renamed-script.jpg",
      type: "image/jpeg",
      content: '<svg><script>alert(1)</script></svg>',
    },
    {
      name: "wrong-mime.png",
      type: "image/jpeg",
      content: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    },
    {
      name: "wrong-signature.png",
      type: "image/png",
      content: Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]),
    },
  ];

  for (const invalidImage of invalidImages) {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([invalidImage.content], { type: invalidImage.type }),
      invalidImage.name
    );
    formData.append("folder", "gallery/general");

    const response = await request("/api/admin/upload", {
      method: "POST",
      cookie: adminCookie,
      body: formData,
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /uzantısı, içerik türü ve gerçek görsel formatı/);
  }
});

test("kullanıcı oluşturma endpointi aşırı isteği 429 ile sınırlar", async () => {
  let rateLimitedResponse = null;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const response = await request("/api/admin/users", {
      method: "POST",
      cookie: adminCookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: {} }),
    });

    if (response.status === 429) {
      rateLimitedResponse = response;
      break;
    }
  }

  assert.ok(rateLimitedResponse, "Endpoint 25 istek içinde rate limit uygulamalı");
  assert.ok(Number(rateLimitedResponse.headers.get("retry-after")) > 0);
});
