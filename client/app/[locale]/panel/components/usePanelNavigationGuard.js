"use client";

import { useEffect, useRef } from "react";
import { installPanelNavigationGuard } from "@/lib/admin/panel-navigation-guard.mjs";

export default function usePanelNavigationGuard(dirty, busy = false, enabled = true) {
  const state = useRef({ dirty, busy });
  state.current = { dirty, busy };
  useEffect(() => {
    if (!enabled) return undefined;
    return installPanelNavigationGuard(window, document, () => state.current);
  }, [enabled]);
}
