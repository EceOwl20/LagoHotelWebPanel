const TURKISH_CHARACTERS = {
  ı: "i",
  İ: "i",
};

export function normalizeSearchText(value) {
  return String(value || "")
    .replace(/[ıİ]/g, (character) => TURKISH_CHARACTERS[character])
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function scoreField(normalizedField, token) {
  if (!normalizedField) return 0;
  if (normalizedField === token) return 100;
  if (normalizedField.startsWith(token)) return 80;

  const words = normalizedField.split(" ");
  if (words.includes(token)) return 70;
  if (words.some((word) => word.startsWith(token))) return 55;
  if (normalizedField.includes(token)) return 35;

  return 0;
}

export function prepareSearchDocument(document) {
  return {
    ...document,
    normalizedSearchFields: (document.searchFields || []).map((field) => ({
      value: normalizeSearchText(field.value),
      weight: Number(field.weight) || 1,
    })),
  };
}

export function rankSearchDocuments(documents, rawQuery, { limit = 20 } = {}) {
  const query = normalizeSearchText(rawQuery);
  const tokens = [...new Set(query.split(" ").filter(Boolean))];

  if (query.length < 2 || tokens.length === 0) return [];

  return documents
    .map((document) => {
      const fields =
        document.normalizedSearchFields ||
        prepareSearchDocument(document).normalizedSearchFields;

      let score = 0;

      for (const token of tokens) {
        const tokenScore = Math.max(
          0,
          ...fields.map((field) => scoreField(field.value, token) * field.weight)
        );

        if (tokenScore === 0) return null;
        score += tokenScore;
      }

      const phraseScore = Math.max(
        0,
        ...fields.map((field) => (field.value.includes(query) ? 30 * field.weight : 0))
      );

      return { ...document, score: score + phraseScore };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        String(left.title).localeCompare(String(right.title), "tr")
    )
    .slice(0, limit)
    .map(
      ({
        searchFields: _searchFields,
        normalizedSearchFields: _normalizedSearchFields,
        score: _score,
        ...result
      }) => result
    );
}
