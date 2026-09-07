export const PANEL_PERMISSIONS = Object.freeze({
  EDIT_CONTENT: "content:edit",
  PUBLISH_CONTENT: "content:publish",
  DELETE_CONTENT: "content:delete",
  MANAGE_USERS: "users:manage",
});

const ROLE_PERMISSIONS = Object.freeze({
  admin: new Set(Object.values(PANEL_PERMISSIONS)),
  editor: new Set([PANEL_PERMISSIONS.EDIT_CONTENT]),
});

export function isPanelRole(role) {
  return Object.hasOwn(ROLE_PERMISSIONS, role);
}

export function hasPanelPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.has(permission) || false;
}
