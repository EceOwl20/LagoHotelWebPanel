"use client";

import { createContext, useContext } from "react";

const SharedMediaContext = createContext({
  contactSection2: null,
  banner: null,
});

export function SharedMediaProvider({ value, children }) {
  return (
    <SharedMediaContext.Provider value={value || {}}>
      {children}
    </SharedMediaContext.Provider>
  );
}

export function useSharedMedia() {
  return useContext(SharedMediaContext);
}
