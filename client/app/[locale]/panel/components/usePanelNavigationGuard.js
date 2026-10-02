"use client";

import { useEffect, useRef } from "react";
import { installPanelNavigationGuard } from "@/lib/admin/panel-navigation-guard.mjs";

export default function usePanelNavigationGuard(dirty, busy = false) {
  const state = useRef({ dirty, busy });
  state.current = { dirty, busy };
  useEffect(() => installPanelNavigationGuard(window, document, () => state.current), []);
}
