import { PAGE_LOCALES } from "./schema.mjs";
import { getBlockDefinition } from "./block-definitions.mjs";

function serialize(value) {
  return JSON.stringify(value ?? null);
}

function hasMeaningfulValue(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (value && typeof value === "object") {
    return Object.values(value).some(hasMeaningfulValue);
  }

  return false;
}

function collectLocalizedValues(
  value,
  locale,
  localizedValues = {},
  path = "root"
) {
  if (!value || typeof value !== "object") return localizedValues;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const itemKey = item?.id ? `id:${item.id}` : `index:${index}`;
      collectLocalizedValues(item, locale, localizedValues, `${path}.${itemKey}`);
    });
    return localizedValues;
  }

  if (
    value.translations &&
    typeof value.translations === "object" &&
    !Array.isArray(value.translations)
  ) {
    const localizedValue = value.translations[locale] ?? null;

    if (hasMeaningfulValue(localizedValue)) {
      localizedValues[`${path}.translations`] = localizedValue;
    }
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (key !== "translations") {
      collectLocalizedValues(
        nestedValue,
        locale,
        localizedValues,
        `${path}.${key}`
      );
    }
  });

  return localizedValues;
}

function createLocaleSnapshot(draft, locale) {
  return {
    slug: draft?.slugs?.[locale] ?? "",
    seo: draft?.seo?.[locale] ?? null,
    values: collectLocalizedValues(draft, locale),
  };
}

function createGlobalSettingsSnapshot(draft) {
  return {
    schemaVersion: draft?.schemaVersion ?? null,
    template: draft?.template ?? null,
    showContactSection: Boolean(draft?.showContactSection),
    hero: {
      image: draft?.hero?.image ?? "",
      overlay: Boolean(draft?.hero?.overlay),
    },
    navigation: {
      visible: Boolean(draft?.navigation?.visible),
      order: draft?.navigation?.order ?? null,
    },
  };
}

function getFieldValue(section, field) {
  if (!field.localized) return section?.[field.name] ?? null;

  return Object.fromEntries(
    PAGE_LOCALES.map((locale) => [
      locale,
      section?.translations?.[locale]?.[field.name] ?? null,
    ])
  );
}

function getFieldChangeType(fieldType) {
  if (["text", "textarea"].includes(fieldType)) return "text";
  if (fieldType === "image") return "image";
  if (fieldType === "imageArray") return "images";
  if (["cardArray", "otherOptionArray"].includes(fieldType)) return "collection";
  return "settings";
}

function getSectionChangeTypes(previousSection, currentSection) {
  const definition = getBlockDefinition(currentSection?.type || previousSection?.type);
  const fields = Array.isArray(definition?.fields) ? definition.fields : [];
  const changeTypes = new Set();
  const knownKeys = new Set(["id", "type", "translations"]);

  fields.forEach((field) => {
    knownKeys.add(field.name);

    if (
      serialize(getFieldValue(previousSection, field)) !==
      serialize(getFieldValue(currentSection, field))
    ) {
      changeTypes.add(getFieldChangeType(field.type));
    }
  });

  const getOtherSettings = (section) =>
    Object.fromEntries(
      Object.entries(section || {}).filter(([key]) => !knownKeys.has(key))
    );

  if (
    serialize(getOtherSettings(previousSection)) !==
    serialize(getOtherSettings(currentSection))
  ) {
    changeTypes.add("settings");
  }

  if (changeTypes.size === 0) changeTypes.add("content");
  return [...changeTypes];
}

function createSectionChange(section, index, changeTypes = []) {
  return {
    id: section.id,
    type: section.type,
    label: getBlockDefinition(section.type)?.label || section.type || "Component",
    position: index + 1,
    changeTypes,
  };
}

export function comparePageDrafts(previousDraft, currentDraft) {
  const previousSections = Array.isArray(previousDraft?.sections)
    ? previousDraft.sections
    : [];
  const currentSections = Array.isArray(currentDraft?.sections)
    ? currentDraft.sections
    : [];
  const previousById = new Map(
    previousSections.map((section) => [section.id, section])
  );
  const currentById = new Map(
    currentSections.map((section) => [section.id, section])
  );

  const added = currentSections.filter((section) => !previousById.has(section.id));
  const removed = previousSections.filter((section) => !currentById.has(section.id));
  const modified = currentSections.filter((section) => {
    const previousSection = previousById.get(section.id);
    return previousSection && serialize(previousSection) !== serialize(section);
  });
  const previousSharedOrder = previousSections
    .filter((section) => currentById.has(section.id))
    .map((section) => section.id);
  const currentSharedOrder = currentSections
    .filter((section) => previousById.has(section.id))
    .map((section) => section.id);
  const orderChanged = serialize(previousSharedOrder) !== serialize(currentSharedOrder);
  const changedLocales = PAGE_LOCALES.filter(
    (locale) =>
      serialize(createLocaleSnapshot(previousDraft, locale)) !==
      serialize(createLocaleSnapshot(currentDraft, locale))
  );
  const settingsChanged =
    serialize(createGlobalSettingsSnapshot(previousDraft)) !==
    serialize(createGlobalSettingsSnapshot(currentDraft));
  const componentChanges = {
    added: added.map((section) =>
      createSectionChange(section, currentSections.indexOf(section))
    ),
    removed: removed.map((section) =>
      createSectionChange(section, previousSections.indexOf(section))
    ),
    modified: modified.map((section) => {
      const previousSection = previousById.get(section.id);
      return createSectionChange(
        section,
        currentSections.indexOf(section),
        getSectionChangeTypes(previousSection, section)
      );
    }),
  };

  return {
    isIdentical:
      added.length === 0 &&
      removed.length === 0 &&
      modified.length === 0 &&
      !orderChanged &&
      changedLocales.length === 0 &&
      !settingsChanged,
    changedLocales,
    settingsChanged,
    components: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      orderChanged,
    },
    componentChanges,
  };
}
