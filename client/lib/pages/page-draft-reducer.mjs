import { applyPagePresetSections } from "./page-presets.mjs";

export const PAGE_DRAFT_ACTIONS = Object.freeze({
  REPLACE: "replace",
  APPLY_PRESET: "applyPreset",
  SET_HERO_IMAGE: "setHeroImage",
  UPDATE_HERO_TRANSLATION: "updateHeroTranslation",
  SET_SLUG: "setSlug",
  UPDATE_NAVIGATION_TRANSLATION: "updateNavigationTranslation",
  UPDATE_NAVIGATION_FIELD: "updateNavigationField",
  UPDATE_SEO_TRANSLATION: "updateSeoTranslation",
  UPDATE_SECTION_TRANSLATION: "updateSectionTranslation",
  UPDATE_SECTION_FIELD: "updateSectionField",
  MOVE_SECTION: "moveSection",
  ADD_SECTION: "addSection",
  REMOVE_SECTION: "removeSection",
});

function updateTranslationCollection(collection, locale, field, value) {
  return {
    ...collection,
    [locale]: {
      ...(collection?.[locale] || {}),
      [field]: value,
    },
  };
}

export function pageDraftReducer(draft, action) {
  switch (action.type) {
    case PAGE_DRAFT_ACTIONS.REPLACE:
      return action.draft;

    case PAGE_DRAFT_ACTIONS.APPLY_PRESET:
      return applyPagePresetSections(draft, action.presetId);

    case PAGE_DRAFT_ACTIONS.SET_HERO_IMAGE:
      return {
        ...draft,
        hero: { ...draft.hero, image: action.value },
      };

    case PAGE_DRAFT_ACTIONS.UPDATE_HERO_TRANSLATION:
      return {
        ...draft,
        hero: {
          ...draft.hero,
          translations: updateTranslationCollection(
            draft.hero.translations,
            action.locale,
            action.field,
            action.value
          ),
        },
      };

    case PAGE_DRAFT_ACTIONS.SET_SLUG:
      return {
        ...draft,
        slugs: { ...draft.slugs, [action.locale]: action.value },
      };

    case PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_TRANSLATION:
      return {
        ...draft,
        navigation: {
          ...draft.navigation,
          translations: updateTranslationCollection(
            draft.navigation.translations,
            action.locale,
            action.field,
            action.value
          ),
        },
      };

    case PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_FIELD:
      return {
        ...draft,
        navigation: { ...draft.navigation, [action.field]: action.value },
      };

    case PAGE_DRAFT_ACTIONS.UPDATE_SEO_TRANSLATION:
      return {
        ...draft,
        seo: updateTranslationCollection(
          draft.seo,
          action.locale,
          action.field,
          action.value
        ),
      };

    case PAGE_DRAFT_ACTIONS.UPDATE_SECTION_TRANSLATION:
      return {
        ...draft,
        sections: draft.sections.map((section) =>
          section.id === action.sectionId
            ? {
                ...section,
                translations: updateTranslationCollection(
                  section.translations,
                  action.locale,
                  action.field,
                  action.value
                ),
              }
            : section
        ),
      };

    case PAGE_DRAFT_ACTIONS.UPDATE_SECTION_FIELD:
      return {
        ...draft,
        sections: draft.sections.map((section) =>
          section.id === action.sectionId
            ? { ...section, [action.field]: action.value }
            : section
        ),
      };

    case PAGE_DRAFT_ACTIONS.MOVE_SECTION: {
      const targetIndex = action.index + action.direction;

      if (targetIndex < 0 || targetIndex >= draft.sections.length) {
        return draft;
      }

      const sections = [...draft.sections];
      const [section] = sections.splice(action.index, 1);
      sections.splice(targetIndex, 0, section);
      return { ...draft, sections };
    }

    case PAGE_DRAFT_ACTIONS.ADD_SECTION:
      return { ...draft, sections: [...draft.sections, action.section] };

    case PAGE_DRAFT_ACTIONS.REMOVE_SECTION:
      return {
        ...draft,
        sections: draft.sections.filter((section) => section.id !== action.sectionId),
      };

    default:
      return draft;
  }
}
