"use client";

import { createContext, useContext } from "react";

const ContentEditLockContext = createContext(null);

export const ContentEditLockProvider = ContentEditLockContext.Provider;

export function useContentEditLockContext() {
  return useContext(ContentEditLockContext);
}
