import assert from "node:assert/strict";
import test from "node:test";
import {
  AZURA_CAROUSEL_KEYS,
  getAzuraHomepageSectionConnection,
  isValidAzuraHomepageSection,
  requestAzuraHomepageSection,
} from "./azura-homepage-section.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const revision = "a".repeat(64);
const fields = {
  subtitle: "Olanaklar",
  title: "Hizmetler",
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap((number) => [
    [`title${number}`, `Başlık ${number}`],
    [`text${number}`, `Açıklama ${number}`],
  ])),
  buttonText: "Keşfet",
};
const section = Object.fromEntries(["tr", "en", "de", "ru"].map((locale) => [locale, { ...fields }]));
const carousel = {
  slides: AZURA_CAROUSEL_KEYS.map((key) => ({
    key,
    image: `/uploads/pages/homepage/carousel-${key}.jpg`,
    translations: Object.fromEntries(["tr", "en", "de", "ru"].map((locale) => [locale, {
      title: `${key} ${locale}`,
      alt: `${key} görseli ${locale}`,
    }])),
  })),
};

test("yalnızca izin verilen anasayfa bölüm adresi türetilir", () => {
  assert.equal(getAzuraHomepageSectionConnection("essentials", env).url,
    "http://localhost:3001/api/azura/homepage/sections/essentials");
  assert.equal(getAzuraHomepageSectionConnection("carousel", env).url,
    "http://localhost:3001/api/azura/homepage/sections/carousel");
  assert.throws(() => getAzuraHomepageSectionConnection("../experience", env),
    (error) => error.status === 404);
  assert.throws(() => getAzuraHomepageSectionConnection("homepage", env),
    (error) => error.status === 404);
  assert.throws(() => getAzuraHomepageSectionConnection("essentials", {
    ...env,
    AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }));
});

test("kaydırıcı tam beş sabit kartı, görseli ve dört dil metnini ister", () => {
  assert.equal(isValidAzuraHomepageSection("carousel", carousel), true);
  assert.equal(isValidAzuraHomepageSection("carousel", { slides: carousel.slides.slice(0, 4) }), false);
  assert.equal(isValidAzuraHomepageSection("carousel", {
    slides: [carousel.slides[1], carousel.slides[0], ...carousel.slides.slice(2)],
  }), false);
  assert.equal(isValidAzuraHomepageSection("carousel", {
    slides: [{ ...carousel.slides[0], link: "/rooms" }, ...carousel.slides.slice(1)],
  }), false);
  assert.equal(isValidAzuraHomepageSection("carousel", {
    slides: [{ ...carousel.slides[0], image: "/uploads/pages/homepage/../bad.jpg" }, ...carousel.slides.slice(1)],
  }), false);
  assert.equal(isValidAzuraHomepageSection("carousel", {
    slides: [{
      ...carousel.slides[0],
      translations: {
        ...carousel.slides[0].translations,
        en: { title: "a".repeat(201), alt: "Alt" },
      },
    }, ...carousel.slides.slice(1)],
  }), false);
});

test("kaydırıcı PUT yalnızca section ve revision bilgisini iletir", async () => {
  let request;
  const nextRevision = "c".repeat(64);
  const result = await requestAzuraHomepageSection("PUT", "carousel", carousel, {
    env,
    revision,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ section: carousel, revision: nextRevision }) };
    },
  });
  assert.deepEqual(result, { section: carousel, revision: nextRevision });
  assert.equal(request.url, getAzuraHomepageSectionConnection("carousel", env).url);
  assert.equal(request.options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(request.options.body), { section: carousel });
});

test("olanaklar şeması dört dilde tam 15 alan ve Azura sınırlarını ister", () => {
  assert.equal(isValidAzuraHomepageSection("essentials", section), true);
  assert.equal(isValidAzuraHomepageSection("unknown", section), false);
  assert.equal(isValidAzuraHomepageSection("essentials", { ...section, fr: fields }), false);
  assert.equal(isValidAzuraHomepageSection("essentials", { ...section, tr: { ...fields, title1: " " } }), false);
  assert.equal(isValidAzuraHomepageSection("essentials", { ...section, en: { ...fields, text6: "a".repeat(2001) } }), false);
  assert.equal(isValidAzuraHomepageSection("essentials", { ...section, ru: { ...fields, text2: "satır\nsonu" } }), false);
});

test("PUT servis tokenını, yalnızca section gövdesini ve If-Match'i gönderir", async () => {
  let request;
  const nextRevision = "b".repeat(64);
  const result = await requestAzuraHomepageSection("PUT", "essentials", section, {
    env,
    revision,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ section, revision: nextRevision }) };
    },
  });
  assert.deepEqual(result, { section, revision: nextRevision });
  assert.equal(request.url, getAzuraHomepageSectionConnection("essentials", env).url);
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(request.options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(request.options.body), { section });
});

test("PUT geçerli revision olmadan Azura'ya gönderilmez", async () => {
  let called = false;
  await assert.rejects(requestAzuraHomepageSection("PUT", "essentials", section, {
    env,
    fetchImpl: async () => { called = true; },
  }), (error) => error.status === 400);
  assert.equal(called, false);
});

test("GET yanıtı bölüm verisi ve revision içermelidir", async () => {
  await assert.rejects(requestAzuraHomepageSection("GET", "essentials", undefined, {
    env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ section }) }),
  }), (error) => error.status === 502);
});

test("Azura 409 çakışması başarılı kayıt sayılmaz", async () => {
  await assert.rejects(requestAzuraHomepageSection("PUT", "essentials", section, {
    env,
    revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Başka kullanıcı güncelledi." }) }),
  }), (error) => error.status === 409);
});
