import { createPageCard } from "@/lib/pages/schema.mjs";
import EditorField from "./EditorField";
import PageImagePicker from "./PageImagePicker";

const LOCALE_LABELS = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

function updateTranslation(translations, locale, field, value) {
  return {
    ...translations,
    [locale]: {
      ...(translations?.[locale] || {}),
      [field]: value,
    },
  };
}

export default function CardArrayField({ field, value = [], locale, onChange }) {
  const cards = Array.isArray(value) ? value : [];
  const localeLabel = LOCALE_LABELS[locale] || locale.toUpperCase();

  const updateCards = (updater) => {
    onChange(
      updater(cards).map((card, order) => ({
        ...card,
        order,
      }))
    );
  };

  const updateCard = (cardId, updater) => {
    updateCards((currentCards) =>
      currentCards.map((card) => (card.id === cardId ? updater(card) : card))
    );
  };

  const updateCardTranslation = (cardId, fieldName, fieldValue) => {
    updateCard(cardId, (card) => ({
      ...card,
      translations: updateTranslation(card.translations, locale, fieldName, fieldValue),
    }));
  };

  const moveCard = (cardIndex, direction) => {
    updateCards((currentCards) => {
      const targetIndex = cardIndex + direction;

      if (targetIndex < 0 || targetIndex >= currentCards.length) {
        return currentCards;
      }

      const nextCards = [...currentCards];
      const [card] = nextCards.splice(cardIndex, 1);
      nextCards.splice(targetIndex, 0, card);
      return nextCards;
    });
  };

  const removeCard = (cardId) => {
    if (!window.confirm("Bu kartı component alanından çıkarmak istediğinize emin misiniz?")) {
      return;
    }

    updateCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{field.labels.plural}</h3>
          <p className="mt-1 text-xs text-stone-500">Toplam {cards.length} kart</p>
        </div>
        <button
          type="button"
          onClick={() => updateCards((currentCards) => [...currentCards, createPageCard()])}
          className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800"
        >
          + {field.addLabel}
        </button>
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {cards.map((card, cardIndex) => {
            const content = card.translations?.[locale] || {};

            return (
              <div
                key={card.id}
                className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-stone-900">
                    {field.labels.singular} {cardIndex + 1}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveCard(cardIndex, -1)}
                      disabled={cardIndex === 0}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                    >
                      Yukarı Taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCard(cardIndex, 1)}
                      disabled={cardIndex === cards.length - 1}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                    >
                      Aşağı Taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCard(card.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                    >
                      Kartı Çıkar
                    </button>
                  </div>
                </div>

                <PageImagePicker
                  label={`${field.labels.singular} görseli`}
                  value={card.image}
                  onChange={(image) =>
                    updateCard(card.id, (currentCard) => ({ ...currentCard, image }))
                  }
                />
                <EditorField
                  label={`${localeLabel} kart başlığı`}
                  value={content.title}
                  onChange={(nextValue) =>
                    updateCardTranslation(card.id, "title", nextValue)
                  }
                />
                <EditorField
                  label={`${localeLabel} kart metni`}
                  value={content.text}
                  onChange={(nextValue) => updateCardTranslation(card.id, "text", nextValue)}
                  textarea
                />
                <EditorField
                  label={`${localeLabel} görsel açıklaması (alt)`}
                  value={content.imageAlt}
                  onChange={(nextValue) =>
                    updateCardTranslation(card.id, "imageAlt", nextValue)
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <EditorField
                    label={`${localeLabel} buton metni`}
                    value={content.buttonText}
                    onChange={(nextValue) =>
                      updateCardTranslation(card.id, "buttonText", nextValue)
                    }
                  />
                  <EditorField
                    label={`${localeLabel} buton bağlantısı`}
                    value={content.buttonHref}
                    onChange={(nextValue) =>
                      updateCardTranslation(card.id, "buttonHref", nextValue)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-sm text-stone-500">
          Henüz kart eklenmedi.
        </div>
      )}
    </div>
  );
}
