export function isValidAzuraRevision(revision) {
  return typeof revision === "string" && /^[a-f0-9]{64}$/.test(revision);
}

export function readAzuraRevision(payload) {
  if (!payload || typeof payload !== "object" || !Object.hasOwn(payload, "revision")) return null;
  if (!isValidAzuraRevision(payload.revision)) return undefined;
  return payload.revision;
}
