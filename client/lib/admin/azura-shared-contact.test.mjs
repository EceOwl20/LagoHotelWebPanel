import assert from "node:assert/strict";
import test from "node:test";
import {
  getAzuraSharedContactConnection,
  isValidAzuraSharedContactDetails,
  requestAzuraSharedContactDetails,
} from "./azura-shared-contact.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const revision = "a".repeat(64);
const details = {
  username: "@AzuraDeluxeResort",
  phone: "+90 242 517 12 34",
  callCenter: "+90 242 277 11 43",
  email: "info@azuradeluxe.com",
  instagramUrl: "https://www.instagram.com/azuradeluxeresort/",
  facebookUrl: "https://www.facebook.com/AzuraDeluxeResort/",
  youtubeUrl: "https://www.youtube.com/channel/UC3Z23WuWOhmpFnbw9fLI1-g",
  reservationUrl: "https://azuradeluxehotel.orsmod.com/",
  translations: Object.fromEntries(["tr", "en", "de", "ru"].map((locale) => [locale, {
    contactForMore: `Bilgi ${locale}`,
    address: `Otel adresi ${locale}`,
    phoneLabel: `Telefon ${locale}`,
    callCenterLabel: `Çağrı merkezi ${locale}`,
    emailLabel: `E-posta ${locale}`,
    reservationButtonText: `Rezervasyon ${locale}`,
  }])),
};

test("iletişim API adresi yalnızca yapılandırılmış Azura sunucusundan türetilir", () => {
  assert.equal(getAzuraSharedContactConnection(env).url,
    "http://localhost:3001/api/azura/shared/contact/details");
  assert.throws(() => getAzuraSharedContactConnection({ ...env,
    AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }), (error) => error.status === 503);
});

test("iletişim şeması tam alanları, dört dili ve güvenli bağlantıları ister", () => {
  assert.equal(isValidAzuraSharedContactDetails(details), true);
  const altered = (update) => {
    const value = structuredClone(details);
    update(value);
    return isValidAzuraSharedContactDetails(value);
  };
  assert.equal(altered((value) => { value.other = "extra"; }), false);
  assert.equal(altered((value) => { delete value.translations.ru; }), false);
  assert.equal(altered((value) => { value.translations.tr.address = " "; }), false);
  assert.equal(altered((value) => { value.translations.en.address = "x".repeat(501); }), false);
  assert.equal(altered((value) => { value.translations.de.phoneLabel = "bad\nlabel"; }), false);
  assert.equal(altered((value) => { value.phone = "tel:+902425171234"; }), false);
  assert.equal(altered((value) => { value.callCenter = "+90 12"; }), false);
  assert.equal(altered((value) => { value.email = "person@example.com?subject=x"; }), false);
  assert.equal(altered((value) => { value.instagramUrl = "http://example.com"; }), false);
  assert.equal(altered((value) => { value.reservationUrl = "https://user:password@example.com"; }), false);
});

test("GET ve PUT yalnızca servis tokenı ile çalışır; PUT If-Match ve tam details gönderir", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ details, revision }) };
  };
  assert.deepEqual(await requestAzuraSharedContactDetails("GET", undefined, { env, fetchImpl }),
    { details, revision });
  assert.deepEqual(await requestAzuraSharedContactDetails("PUT", details, { env, fetchImpl, revision }),
    { details, revision });
  assert.equal(requests[0].options.headers.Authorization, "Bearer test-secret");
  assert.equal(requests[0].options.headers["If-Match"], undefined);
  assert.equal(requests[1].options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(requests[1].options.body), { details });
});

test("eski revision 409 olarak iletilir, geçersiz PUT Azura'ya gönderilmez", async () => {
  await assert.rejects(requestAzuraSharedContactDetails("PUT", details, {
    env, revision,
    fetchImpl: async () => ({ ok: false, status: 409,
      json: async () => ({ error: "İletişim verisi başka bir kullanıcı tarafından güncellendi." }) }),
  }), (error) => error.status === 409);
  let called = false;
  await assert.rejects(requestAzuraSharedContactDetails("PUT", details, {
    env, fetchImpl: async () => { called = true; },
  }), (error) => error.status === 400);
  assert.equal(called, false);
});
