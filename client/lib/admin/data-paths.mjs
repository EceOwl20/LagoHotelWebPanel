import path from "node:path";

function resolveOptionalAbsolutePath(value, variableName) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) return null;

  if (!path.isAbsolute(normalizedValue)) {
    throw new Error(`${variableName} mutlak bir dosya yolu olmalıdır.`);
  }

  return path.normalize(normalizedValue);
}

export function resolvePanelDataPaths({ appRoot, dataRoot }) {
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedDataRoot = resolveOptionalAbsolutePath(dataRoot, "PANEL_DATA_ROOT");

  return Object.freeze({
    appRoot: resolvedAppRoot,
    dataRoot: resolvedDataRoot,
    usesPersistentDataRoot: Boolean(resolvedDataRoot),
    contentRoot: resolvedDataRoot
      ? path.join(resolvedDataRoot, "content")
      : path.join(resolvedAppRoot, "content"),
    messagesRoot: resolvedDataRoot
      ? path.join(resolvedDataRoot, "messages")
      : path.join(resolvedAppRoot, "messages"),
    publicRoot: path.join(resolvedAppRoot, "public"),
    uploadsRoot: path.join(resolvedAppRoot, "public", "uploads"),
  });
}
