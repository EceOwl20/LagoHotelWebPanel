import assert from "node:assert/strict";
import test from "node:test";
import {
  AzuraConnectionError,
  getAzuraConnection,
  isValidExperience,
  requestAzuraExperience,
} from "./azura-experience.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const revision = "a".repeat(64);
const experience = {
  background: {
    image: "/uploads/pages/homepage/experience-background.jpg",
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((locale) =>
      [locale, { alt: `Azura background ${locale}` }]
    )),
  },
  foreground: {
    image: "/uploads/pages/homepage/experience-foreground.jpg",
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((locale) =>
      [locale, { alt: `Azura foreground ${locale}` }]
    )),
  },
};

test("local Azura bağlantısı kabul edilir, kullanıcı belirlediği hedef reddedilir", () => {
  assert.equal(getAzuraConnection(env).url, env.AZURA_EXPERIENCE_API_URL);
  assert.throws(() => getAzuraConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience" }), AzuraConnectionError);
  assert.throws(() => getAzuraConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/admin/users" }), AzuraConnectionError);
  assert.throws(() => getAzuraConnection({ AZURA_EXPERIENCE_API_URL: env.AZURA_EXPERIENCE_API_URL }), AzuraConnectionError);
});

test("yalnızca Azura experience şeması kabul edilir", () => {
  assert.equal(isValidExperience(experience), true);
  assert.equal(isValidExperience({ ...experience, extra: true }), false);
  assert.equal(isValidExperience({ ...experience, foreground: { ...experience.foreground, image: "/uploads/pages/homepage/../other.jpg" } }), false);
  assert.equal(isValidExperience({ ...experience, background: { ...experience.background, translations: { ...experience.background.translations, tr: { alt: "" } } } }), false);
});

test("servis tokenı yalnızca Azura isteğinde kullanılır ve geçerli veri döner", async () => {
  let request;
  const result = await requestAzuraExperience("PUT", experience, {
    env,
    revision,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ experience, revision: "b".repeat(64) }) };
    },
  });
  assert.deepEqual(result, { experience, revision: "b".repeat(64) });
  assert.equal(request.url, env.AZURA_EXPERIENCE_API_URL);
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(request.options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(request.options.body), { experience });
});

test("eski Azura yanıtı sürümsüz olarak çalışmayı sürdürür", async () => {
  const result = await requestAzuraExperience("GET", undefined, {
    env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ experience }) }),
  });
  assert.deepEqual(result, { experience, revision: null });
});

test("Azura hatası kayıt başarısı sayılmaz", async () => {
  await assert.rejects(
    requestAzuraExperience("PUT", experience, {
      env,
      fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: "Görsel bulunamadı." }) }),
    }),
    /Görsel bulunamadı/
  );
});
