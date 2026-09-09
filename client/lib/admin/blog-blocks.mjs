const BLOG_BLOCK_LEVELS = new Set(["h2", "h3"]);
const BLOG_LOCALES = ["tr", "en", "de", "ru"];

function createEmptyBlockTranslation() {
  return { heading: "", content: "" };
}

export function normalizeBlogContentBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];

  return blocks.map((block, index) => ({
    id: String(block?.id || `blog-block-${index + 1}`),
    headingLevel: BLOG_BLOCK_LEVELS.has(block?.headingLevel)
      ? block.headingLevel
      : "h2",
    image: typeof block?.image === "string" ? block.image : "",
    translations: BLOG_LOCALES.reduce((translations, locale) => {
      const sourceTranslation = block?.translations?.[locale];
      translations[locale] = {
        ...createEmptyBlockTranslation(),
        heading:
          typeof sourceTranslation?.heading === "string"
            ? sourceTranslation.heading
            : "",
        content:
          typeof sourceTranslation?.content === "string"
            ? sourceTranslation.content
            : "",
      };
      return translations;
    }, {}),
  }));
}

export function getBlogContentBlocksValidationError(blocks) {
  if (blocks === undefined) return "";
  if (!Array.isArray(blocks)) return "Blog içerik bölümleri bir liste olmalıdır.";

  const ids = new Set();

  for (const block of blocks) {
    if (!block || typeof block !== "object") {
      return "Geçersiz blog içerik bölümü.";
    }

    const id = String(block.id || "").trim();
    if (!id) return "Her blog içerik bölümünün bir kimliği olmalıdır.";
    if (ids.has(id)) return "Blog içerik bölümü kimlikleri benzersiz olmalıdır.";
    ids.add(id);

    if (!BLOG_BLOCK_LEVELS.has(block.headingLevel)) {
      return "Blog içerik bölümü başlık seviyesi H2 veya H3 olmalıdır.";
    }

    if (block.image !== undefined && typeof block.image !== "string") {
      return "Blog içerik bölümü görsel adresi metin olmalıdır.";
    }

    if (
      block.translations !== undefined &&
      (!block.translations ||
        typeof block.translations !== "object" ||
        Array.isArray(block.translations))
    ) {
      return "Blog içerik bölümü çevirileri geçersiz.";
    }

    for (const translation of Object.values(block.translations || {})) {
      if (
        !translation ||
        typeof translation !== "object" ||
        (translation.heading !== undefined && typeof translation.heading !== "string") ||
        (translation.content !== undefined && typeof translation.content !== "string")
      ) {
        return "Blog içerik bölümü başlık ve metin değerleri geçersiz.";
      }
    }
  }

  return "";
}
