import assert from "node:assert/strict";
import test from "node:test";
import {
  detectImageFormat,
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_EXTENSIONS,
  isAllowedImageExtension,
  validateImageUpload,
} from "./image-upload-policy.mjs";

const signatures = {
  jpeg: Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  png: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif87a: Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]),
  gif89a: Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  webp: Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50,
  ]),
};

test("yalnızca panelde kullanılan raster görsel uzantılarını listeler", () => {
  assert.deepEqual(IMAGE_UPLOAD_EXTENSIONS, [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
  ]);
});

test("desteklenen görsel uzantılarını büyük küçük harften bağımsız kabul eder", () => {
  for (const extension of [".jpg", ".JPEG", ".png", ".WEBP", ".gif"]) {
    assert.equal(isAllowedImageExtension(extension), true);
  }
});

test("SVG, PDF ve çalıştırılabilir dosya uzantılarını reddeder", () => {
  for (const extension of [".svg", ".pdf", ".html", ".js", ".php", ".exe", ""]) {
    assert.equal(isAllowedImageExtension(extension), false);
  }
});

test("dosya seçici filtresinde SVG ve PDF bulunmaz", () => {
  assert.match(IMAGE_UPLOAD_ACCEPT, /image\/jpeg/);
  assert.match(IMAGE_UPLOAD_ACCEPT, /image\/gif/);
  assert.doesNotMatch(IMAGE_UPLOAD_ACCEPT, /svg|pdf/);
});

test("JPEG, PNG, GIF ve WEBP binary imzalarını algılar", () => {
  assert.equal(detectImageFormat(signatures.jpeg), "jpeg");
  assert.equal(detectImageFormat(signatures.png), "png");
  assert.equal(detectImageFormat(signatures.gif87a), "gif");
  assert.equal(detectImageFormat(signatures.gif89a), "gif");
  assert.equal(detectImageFormat(signatures.webp), "webp");
  assert.equal(detectImageFormat(new TextEncoder().encode("not an image")), null);
});

test("uzantı, MIME ve binary imzası eşleşen görselleri kabul eder", () => {
  const cases = [
    [".jpg", "image/jpeg", signatures.jpeg],
    [".jpeg", "IMAGE/JPEG", signatures.jpeg],
    [".png", "image/png", signatures.png],
    [".gif", "image/gif", signatures.gif89a],
    [".webp", "image/webp", signatures.webp],
  ];

  for (const [extension, mimeType, bytes] of cases) {
    assert.deepEqual(validateImageUpload({ extension, mimeType, bytes }), {
      ok: true,
      format: extension === ".jpg" || extension === ".jpeg" ? "jpeg" : extension.slice(1),
    });
  }
});

test("dosya adı görsel olsa bile sahte içeriği reddeder", () => {
  const result = validateImageUpload({
    extension: ".jpg",
    mimeType: "image/jpeg",
    bytes: new TextEncoder().encode('<svg><script>alert(1)</script></svg>'),
  });

  assert.deepEqual(result, { ok: false, reason: "signature" });
});

test("uzantı, MIME ve gerçek format uyuşmazlıklarını ayrı ayrı reddeder", () => {
  assert.deepEqual(
    validateImageUpload({ extension: ".png", mimeType: "image/jpeg", bytes: signatures.png }),
    { ok: false, reason: "mime" }
  );
  assert.deepEqual(
    validateImageUpload({ extension: ".png", mimeType: "image/png", bytes: signatures.jpeg }),
    { ok: false, reason: "signature" }
  );
  assert.deepEqual(
    validateImageUpload({ extension: ".png", mimeType: "", bytes: signatures.png }),
    { ok: false, reason: "mime" }
  );
});
