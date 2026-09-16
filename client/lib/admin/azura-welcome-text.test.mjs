import assert from "node:assert/strict";
import test from "node:test";
import {
  getAzuraWelcomeConnection,
  isValidWelcomeText,
  requestAzuraWelcomeText,
} from "./azura-welcome-text.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const revision = "a".repeat(64);
const welcomeText = Object.fromEntries(["tr", "en", "de", "ru"].map((locale) => [locale, {
  subtitle: ` Azura ${locale}`,
  title: `Başlık ${locale}`,
  text: `Paragraf ${locale}`,
  buttonText: `Keşfet ${locale}`,
}]));

test("karşılama endpoint'i doğrulanan Azura adresinden türetilir", () => {
  assert.equal(getAzuraWelcomeConnection(env).url,
    "http://localhost:3001/api/azura/homepage/welcome/text");
  assert.throws(() => getAzuraWelcomeConnection({
    ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }));
});

test("karşılama metni Azura'nın dört dil ve alan sınırlarına uyar", () => {
  assert.equal(isValidWelcomeText(welcomeText), true);
  assert.equal(isValidWelcomeText({ ...welcomeText, fr: welcomeText.tr }), false);
  assert.equal(isValidWelcomeText({ ...welcomeText, tr: { ...welcomeText.tr, title: " " } }), false);
  assert.equal(isValidWelcomeText({ ...welcomeText, en: { ...welcomeText.en, text: "a".repeat(2001) } }), false);
  assert.equal(isValidWelcomeText({ ...welcomeText, ru: { ...welcomeText.ru, text: "bad\nline" } }), false);
});

test("PUT tokenı, yalnızca welcomeText gövdesini ve If-Match sürümünü Azura'ya iletir", async () => {
  let request;
  const nextRevision = "b".repeat(64);
  const result = await requestAzuraWelcomeText("PUT", welcomeText, {
    env,
    revision,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ welcomeText, revision: nextRevision }) };
    },
  });
  assert.deepEqual(result, { welcomeText, revision: nextRevision });
  assert.equal(request.url, getAzuraWelcomeConnection(env).url);
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(request.options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(request.options.body), { welcomeText });
});

test("PUT geçerli sürüm olmadan Azura'ya gönderilmez", async () => {
  let called = false;
  await assert.rejects(requestAzuraWelcomeText("PUT", welcomeText, {
    env,
    fetchImpl: async () => { called = true; },
  }), (error) => error.status === 400);
  assert.equal(called, false);
});

test("GET yanıtı hem içerik hem sürüm gerektirir", async () => {
  await assert.rejects(requestAzuraWelcomeText("GET", undefined, {
    env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ welcomeText }) }),
  }), (error) => error.status === 502);
});

test("Azura'nın 409 çakışması başarılı kayıt sayılmaz", async () => {
  await assert.rejects(requestAzuraWelcomeText("PUT", welcomeText, {
    env,
    revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "İçerik başka kullanıcı tarafından güncellendi." }) }),
  }), (error) => error.status === 409);
});
