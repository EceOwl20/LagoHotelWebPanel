const STANDARD_TEMPLATE = "standard";
const FIELD_TYPES = new Set([
  "text",
  "textarea",
  "image",
  "select",
  "boolean",
  "imageArray",
  "cardArray",
]);

function validateImageCollection(section, collectionLabel) {
  const errors = [];

  if (!Array.isArray(section.images)) {
    return [`${collectionLabel} görselleri bir dizi olmalıdır.`];
  }

  const imageIds = new Set();

  section.images.forEach((image, imageIndex) => {
    if (!image?.id || typeof image.id !== "string" || imageIds.has(image.id)) {
      errors.push(
        `içindeki görsel ${imageIndex + 1} benzersiz bir id değerine sahip olmalıdır.`
      );
    } else {
      imageIds.add(image.id);
    }

    if (!image?.src || typeof image.src !== "string") {
      errors.push(`içindeki görsel ${imageIndex + 1} için kaynak zorunludur.`);
    }
  });

  return errors;
}

function validateCardCollection(section) {
  const errors = [];

  if (!["grid", "carousel"].includes(section.displayMode)) {
    errors.push("için kart görünümü grid veya carousel olmalıdır.");
  }

  if (!Array.isArray(section.cards)) {
    errors.push("için kartlar bir dizi olmalıdır.");
    return errors;
  }

  const cardIds = new Set();

  section.cards.forEach((card, cardIndex) => {
    if (!card?.id || typeof card.id !== "string" || cardIds.has(card.id)) {
      errors.push(`içindeki kart ${cardIndex + 1} benzersiz bir id değerine sahip olmalıdır.`);
    } else {
      cardIds.add(card.id);
    }

    if (typeof card?.image !== "string") {
      errors.push(`içindeki kart ${cardIndex + 1} için görsel yolu metin olmalıdır.`);
    }
  });

  return errors;
}

const definitions = [
  {
    type: "intro",
    label: "Giriş metni",
    libraryTitle: "Giriş Metni",
    description: "Ortalanmış üst başlık, başlık ve açıklama metni.",
    group: "content",
    allowedTemplates: [STANDARD_TEMPLATE],
    defaultVariant: "centered",
    variants: [{ id: "centered", label: "Ortalanmış" }],
    fields: [
      { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
      { name: "title", label: "Başlık", type: "text", localized: true },
      { name: "text", label: "Metin", type: "textarea", localized: true },
    ],
    validate: () => [],
  },
  {
    type: "imageText",
    label: "Görsel ve metin",
    libraryTitle: "Görsel + Metin",
    description: "Görseli sağda veya solda kullanılabilen iki kolonlu içerik.",
    group: "content",
    allowedTemplates: [STANDARD_TEMPLATE],
    defaultVariant: "imageLeft",
    variants: [
      { id: "imageLeft", label: "Görsel solda" },
      { id: "imageRight", label: "Görsel sağda" },
    ],
    fields: [
      {
        name: "image",
        label: "Bölüm görseli",
        type: "image",
        localized: false,
        description: "Galeriden bir görsel seçebilir veya JPG, PNG, WEBP ya da GIF yükleyebilirsin.",
      },
      {
        name: "imagePosition",
        label: "Görsel konumu",
        type: "select",
        localized: false,
        options: [
          { label: "Solda", value: "left" },
          { label: "Sağda", value: "right" },
        ],
      },
      { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
      { name: "title", label: "Başlık", type: "text", localized: true },
      { name: "text", label: "Metin", type: "textarea", localized: true },
      { name: "imageAlt", label: "Görsel açıklaması (alt)", type: "text", localized: true },
      { name: "buttonText", label: "Buton metni", type: "text", localized: true },
      { name: "buttonHref", label: "Buton bağlantısı", type: "text", localized: true },
    ],
    resolveVariant: (section) =>
      section.imagePosition === "right" ? "imageRight" : "imageLeft",
    validate: (section) =>
      ["left", "right"].includes(section.imagePosition)
        ? []
        : ["için görsel konumu left veya right olmalıdır."],
  },
  {
    type: "gallery",
    label: "Görsel galerisi",
    libraryTitle: "Görsel Galerisi",
    description: "Görsel eklenip çıkarılabilen ve serbestçe kaydırılabilen yatay galeri.",
    group: "media",
    allowedTemplates: [STANDARD_TEMPLATE],
    defaultVariant: "horizontal",
    variants: [{ id: "horizontal", label: "Yatay galeri" }],
    fields: [
      { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
      { name: "title", label: "Başlık", type: "text", localized: true },
      { name: "text", label: "Metin", type: "textarea", localized: true },
      {
        name: "images",
        label: "Galeri görselleri",
        type: "imageArray",
        localized: false,
        labels: { singular: "Galeri görseli", plural: "Galeri görselleri" },
        addLabel: "Galeriye yeni görsel ekle",
      },
    ],
    validate: (section) => validateImageCollection(section, "galeri"),
  },
  {
    type: "carousel",
    label: "Görsel carousel",
    libraryTitle: "Görsel Carousel",
    description: "Döngülü geçiş, yön butonları ve slayt göstergeleri olan görsel alanı.",
    group: "media",
    allowedTemplates: [STANDARD_TEMPLATE],
    defaultVariant: "centered",
    variants: [{ id: "centered", label: "Ortalanmış carousel" }],
    fields: [
      { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
      { name: "title", label: "Başlık", type: "text", localized: true },
      { name: "text", label: "Metin", type: "textarea", localized: true },
      {
        name: "images",
        label: "Carousel görselleri",
        type: "imageArray",
        localized: false,
        labels: { singular: "Carousel görseli", plural: "Carousel görselleri" },
        addLabel: "Carousel'e yeni görsel ekle",
      },
    ],
    validate: (section) => validateImageCollection(section, "carousel"),
  },
  {
    type: "callToAction",
    label: "Arka plan görselli CTA",
    libraryTitle: "Arka Plan CTA",
    description: "Arka plan görseli, metin ve aksiyon butonu içeren vurgu alanı.",
    group: "marketing",
    allowedTemplates: [STANDARD_TEMPLATE],
    defaultVariant: "image",
    variants: [{ id: "image", label: "Arka plan görselli" }],
    fields: [
      { name: "image", label: "CTA arka plan görseli", type: "image", localized: false },
      {
        name: "overlay",
        label: "Görselin üzerinde karartma kullan",
        type: "boolean",
        localized: false,
        defaultValue: true,
      },
      { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
      { name: "title", label: "Başlık", type: "text", localized: true },
      { name: "text", label: "Metin", type: "textarea", localized: true },
      { name: "imageAlt", label: "Görsel açıklaması (alt)", type: "text", localized: true },
      { name: "buttonText", label: "Buton metni", type: "text", localized: true },
      { name: "buttonHref", label: "Buton bağlantısı", type: "text", localized: true },
    ],
    validate: (section) =>
      typeof section.overlay === "boolean"
        ? []
        : ["için karartma değeri true veya false olmalıdır."],
  },
  {
    type: "cardCollection",
    label: "Kart koleksiyonu",
    libraryTitle: "Kart Koleksiyonu",
    description: "Grid veya carousel görünümünde sıralanabilir görsel ve metin kartları.",
    group: "content",
    allowedTemplates: [STANDARD_TEMPLATE],
    defaultVariant: "grid",
    variants: [
      { id: "grid", label: "Grid" },
      { id: "carousel", label: "Carousel" },
    ],
    fields: [
      {
        name: "displayMode",
        label: "Kart görünümü",
        type: "select",
        localized: false,
        options: [
          { label: "Grid", value: "grid" },
          { label: "Carousel", value: "carousel" },
        ],
      },
      { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
      { name: "title", label: "Başlık", type: "text", localized: true },
      { name: "text", label: "Metin", type: "textarea", localized: true },
      {
        name: "cards",
        label: "Kartlar",
        type: "cardArray",
        localized: false,
        labels: { singular: "Kart", plural: "Kartlar" },
        addLabel: "Yeni kart ekle",
      },
    ],
    resolveVariant: (section) =>
      section.displayMode === "carousel" ? "carousel" : "grid",
    validate: validateCardCollection,
  },
];

function validateDefinitionRegistry(items) {
  const errors = [];
  const types = new Set();

  items.forEach((definition, index) => {
    const label = `Block tanımı ${index + 1}`;

    if (!definition.type || typeof definition.type !== "string") {
      errors.push(`${label} için type zorunludur.`);
    } else if (types.has(definition.type)) {
      errors.push(`${label} için tekrarlanan type kullanılmıştır: ${definition.type}.`);
    } else {
      types.add(definition.type);
    }

    if (!definition.label || !definition.libraryTitle || !definition.description) {
      errors.push(`${label} için panel metadatası eksiktir.`);
    }

    if (!Array.isArray(definition.allowedTemplates) || definition.allowedTemplates.length === 0) {
      errors.push(`${label} en az bir sayfa şablonunda kullanılmalıdır.`);
    }

    const variantIds = new Set((definition.variants || []).map((variant) => variant.id));

    if (!variantIds.has(definition.defaultVariant)) {
      errors.push(`${label} için varsayılan varyant, varyant listesinde bulunmalıdır.`);
    }

    if (!Array.isArray(definition.fields) || typeof definition.validate !== "function") {
      errors.push(`${label} için alan veya doğrulama sözleşmesi eksiktir.`);
      return;
    }

    const fieldNames = new Set();

    definition.fields.forEach((field, fieldIndex) => {
      const fieldLabel = `${label}, alan ${fieldIndex + 1}`;

      if (!field?.name || typeof field.name !== "string") {
        errors.push(`${fieldLabel} için name zorunludur.`);
      } else if (fieldNames.has(field.name)) {
        errors.push(`${label} için tekrarlanan alan adı kullanılmıştır: ${field.name}.`);
      } else {
        fieldNames.add(field.name);
      }

      if (!field?.label || typeof field.label !== "string") {
        errors.push(`${fieldLabel} için label zorunludur.`);
      }

      if (!FIELD_TYPES.has(field?.type)) {
        errors.push(`${fieldLabel} için desteklenmeyen alan tipi: ${field?.type ?? "boş"}.`);
      }

      if (typeof field?.localized !== "boolean") {
        errors.push(`${fieldLabel} için localized true veya false olmalıdır.`);
      }

      if (field?.type === "select") {
        if (!Array.isArray(field.options) || field.options.length === 0) {
          errors.push(`${fieldLabel} için en az bir select seçeneği zorunludur.`);
        } else {
          const optionValues = new Set();

          field.options.forEach((option) => {
            if (!option?.label || !option?.value) {
              errors.push(`${fieldLabel} için select seçeneklerinde label ve value zorunludur.`);
            } else if (optionValues.has(option.value)) {
              errors.push(`${fieldLabel} için tekrarlanan select değeri: ${option.value}.`);
            } else {
              optionValues.add(option.value);
            }
          });
        }
      }

      if (
        ["imageArray", "cardArray"].includes(field?.type) &&
        (!field.labels?.singular || !field.labels?.plural || !field.addLabel)
      ) {
        errors.push(`${fieldLabel} için dizi panel etiketleri zorunludur.`);
      }

      if (
        field?.type === "boolean" &&
        field.defaultValue !== undefined &&
        typeof field.defaultValue !== "boolean"
      ) {
        errors.push(`${fieldLabel} için boolean varsayılan değeri true veya false olmalıdır.`);
      }
    });
  });

  return errors;
}

const registryErrors = validateDefinitionRegistry(definitions);

if (registryErrors.length > 0) {
  throw new Error(`Block kayıt sistemi geçersiz:\n${registryErrors.join("\n")}`);
}

export const BLOCK_DEFINITIONS = Object.freeze(
  Object.fromEntries(definitions.map((definition) => [definition.type, Object.freeze(definition)]))
);

export const BLOCK_TYPES = Object.freeze(definitions.map((definition) => definition.type));

export function getBlockDefinition(type) {
  return BLOCK_DEFINITIONS[type] || null;
}

export function getBlockDefinitionsForTemplate(template) {
  return definitions.filter((definition) => definition.allowedTemplates.includes(template));
}

export function getBlockVariant(section) {
  const definition = getBlockDefinition(section?.type);

  if (!definition) {
    return null;
  }

  const candidate = section.variant || definition.resolveVariant?.(section) || definition.defaultVariant;
  return definition.variants.some((variant) => variant.id === candidate)
    ? candidate
    : definition.defaultVariant;
}

export function validateBlock(section, template = STANDARD_TEMPLATE) {
  const definition = getBlockDefinition(section?.type);

  if (!definition) {
    return [`için desteklenmeyen component tipi: ${section?.type ?? "boş"}.`];
  }

  if (!definition.allowedTemplates.includes(template)) {
    return [`${definition.label} componenti ${template} şablonunda kullanılamaz.`];
  }

  if (
    section.variant &&
    !definition.variants.some((variant) => variant.id === section.variant)
  ) {
    return [`için desteklenmeyen varyant: ${section.variant}.`];
  }

  return definition.validate(section);
}

export { validateDefinitionRegistry };
