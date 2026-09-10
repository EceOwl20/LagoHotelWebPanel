export const PERMANENT_DELETE_CONFIRMATION = "KALICI OLARAK SİL";

export function isPermanentDeleteConfirmed(value) {
  return String(value || "").trim() === PERMANENT_DELETE_CONFIRMATION;
}
