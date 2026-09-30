import "server-only";

import { hasPanelPermission } from "./permissions.mjs";
import { PANEL_SITES } from "./user-policy.mjs";

export class PanelAuthorizationError extends Error {
  constructor(message = "Bu işlem için yetkiniz bulunmuyor.") {
    super(message);
    this.name = "PanelAuthorizationError";
    this.status = 403;
  }
}

export function assertPanelPermission(session, permission) {
  if (!session || !hasPanelPermission(session.role, permission)) {
    throw new PanelAuthorizationError();
  }
}

export function hasPanelSiteAccess(session, site) {
  if (!session) {
    return false;
  }

  if (!PANEL_SITES.includes(site)) {
    return false;
  }

  if (!Array.isArray(session.sites)) {
    return false;
  }

  return session.sites.includes(site);
}

export function assertPanelSiteAccess(session, site) {
  if (!hasPanelSiteAccess(session, site)) {
    throw new PanelAuthorizationError(
      "Bu otel için erişim yetkiniz bulunmuyor."
    );
  }
}