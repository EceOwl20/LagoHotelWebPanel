export const IMAGE_UPLOAD_EXTENSIONS = Object.freeze([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

export const IMAGE_UPLOAD_ACCEPT = [
  ...IMAGE_UPLOAD_EXTENSIONS,
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
].join(",");

const IMAGE_FORMATS = Object.freeze({
  jpeg: Object.freeze({
    extensions: Object.freeze([".jpg", ".jpeg"]),
    mimeTypes: Object.freeze(["image/jpeg"]),
  }),
  png: Object.freeze({
    extensions: Object.freeze([".png"]),
    mimeTypes: Object.freeze(["image/png"]),
  }),
  webp: Object.freeze({
    extensions: Object.freeze([".webp"]),
    mimeTypes: Object.freeze(["image/webp"]),
  }),
  gif: Object.freeze({
    extensions: Object.freeze([".gif"]),
    mimeTypes: Object.freeze(["image/gif"]),
  }),
});

const formatByExtension = new Map(
  Object.entries(IMAGE_FORMATS).flatMap(([format, definition]) =>
    definition.extensions.map((extension) => [extension, format])
  )
);

export function isAllowedImageExtension(extension) {
  return formatByExtension.has(String(extension || "").toLowerCase());
}

function hasBytes(bytes, expected, offset = 0) {
  if (!bytes || bytes.length < offset + expected.length) return false;
  return expected.every((value, index) => bytes[offset + index] === value);
}

export function detectImageFormat(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);

  if (hasBytes(data, [0xff, 0xd8, 0xff])) return "jpeg";
  if (hasBytes(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  if (
    hasBytes(data, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    hasBytes(data, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "gif";
  }
  if (
    hasBytes(data, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytes(data, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }

  return null;
}

export function validateImageUpload({ extension, mimeType, bytes }) {
  const normalizedExtension = String(extension || "").toLowerCase();
  const normalizedMimeType = String(mimeType || "").toLowerCase().split(";", 1)[0].trim();
  const extensionFormat = formatByExtension.get(normalizedExtension);

  if (!extensionFormat) {
    return { ok: false, reason: "extension" };
  }

  const definition = IMAGE_FORMATS[extensionFormat];
  if (!definition.mimeTypes.includes(normalizedMimeType)) {
    return { ok: false, reason: "mime" };
  }

  if (detectImageFormat(bytes) !== extensionFormat) {
    return { ok: false, reason: "signature" };
  }

  return { ok: true, format: extensionFormat };
}
