export function isSafeUploadUrl(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/uploads/") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return false;
  }

  const segments = value.split("/").slice(1);

  return (
    segments.length >= 2 &&
    segments[0] === "uploads" &&
    segments.every((segment) => segment && segment !== "." && segment !== "..")
  );
}

export function formatMediaReferencePath(path) {
  return path.reduce((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }

    return result ? `${result}.${segment}` : segment;
  }, "");
}

function collectReferences(value, targetUrl, path, references) {
  if (value === targetUrl) {
    references.push(formatMediaReferencePath(path));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectReferences(item, targetUrl, [...path, index], references);
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, childValue]) => {
      collectReferences(childValue, targetUrl, [...path, key], references);
    });
  }
}

export function findMediaReferencesInSources(
  sources,
  targetUrl,
  { excludeSourceIds = [] } = {}
) {
  if (!isSafeUploadUrl(targetUrl)) {
    throw new Error("Geçersiz upload adresi.");
  }

  const excludedIds = new Set(excludeSourceIds);

  return sources.flatMap((source) => {
    if (!source?.id || excludedIds.has(source.id)) {
      return [];
    }

    const paths = [];
    collectReferences(source.content, targetUrl, [], paths);

    return paths.map((path) => ({
      sourceId: source.id,
      sourceType: source.type || "content",
      label: source.label || source.id,
      path,
    }));
  });
}
