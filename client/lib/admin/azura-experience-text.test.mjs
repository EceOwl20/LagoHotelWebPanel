import assert from "node:assert/strict";
import test from "node:test";
import {
  getAzuraTextConnection,
  isValidExperienceText,
  requestAzuraExperienceText,
} from "./azura-experience-text.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3000/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const revision = "c".repeat(64);
const experienceText = Object.fromEntries(["tr", "en", "de", "ru"].map((locale) => [locale, {
  subtitle: `Azura ${locale}`,
  title: `Başlık ${locale}`,
  text1: `Birinci paragraf ${locale}`,
  text2: `İkinci paragraf ${locale}`,
  buttonText: `Galeri ${locale}`,
}]));

test("metin endpoint'i yalnızca doğrulanan Azura adresinden türetilir", () => {
  assert.equal(getAzuraTextConnection(env).url,
    "http://localhost:3000/api/azura/homepage/experience/text");
  assert.throws(() => getAzuraTextConnection({
    ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }));
});

test("metin şeması Azura sınırlarıyla doğrulanır", () => {
  assert.equal(isValidExperienceText(experienceText), true);
  assert.equal(isValidExperienceText({ ...experienceText, fr: experienceText.tr }), false);
  assert.equal(isValidExperienceText({ ...experienceText, tr: { ...experienceText.tr, title: " " } }), false);
  assert.equal(isValidExperienceText({ ...experienceText, en: { ...experienceText.en, text1: "a".repeat(2001) } }), false);
  assert.equal(isValidExperienceText({ ...experienceText, ru: { ...experienceText.ru, text2: "bad\nline" } }), false);
});

test("servis tokenı Azura metin API isteğinde kullanılır", async () => {
  let request;
  const result = await requestAzuraExperienceText("PUT", experienceText, {
    env,
    revision,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ experienceText, revision: "d".repeat(64) }) };
    },
  });
  assert.deepEqual(result, { experienceText, revision: "d".repeat(64) });
  assert.equal(request.url, getAzuraTextConnection(env).url);
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(request.options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(request.options.body), { experienceText });
});

test("eski metin API yanıtı sürümsüz olarak çalışır", async () => {
  const result = await requestAzuraExperienceText("GET", undefined, {
    env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ experienceText }) }),
  });
  assert.deepEqual(result, { experienceText, revision: null });
});

test("Azura metin API hatası başarılı kayıt sayılmaz", async () => {
  await assert.rejects(requestAzuraExperienceText("PUT", experienceText, {
    env,
    fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: "Metin geçersiz." }) }),
  }), /Metin geçersiz/);
});
