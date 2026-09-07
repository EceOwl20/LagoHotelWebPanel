import "server-only";

import { hasPanelPermission } from "./permissions.mjs";

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
