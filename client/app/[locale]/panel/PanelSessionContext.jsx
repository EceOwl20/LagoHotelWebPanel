"use client";

import { createContext, useContext } from "react";
import { hasPanelPermission } from "@/lib/admin/permissions.mjs";

const PanelSessionContext = createContext(null);

export function PanelSessionProvider({ user, children }) {
  return (
    <PanelSessionContext.Provider value={user}>
      {children}
    </PanelSessionContext.Provider>
  );
}

export function usePanelSession() {
  return useContext(PanelSessionContext);
}

export function usePanelPermission(permission) {
  const user = usePanelSession();
  return hasPanelPermission(user?.role, permission);
}
