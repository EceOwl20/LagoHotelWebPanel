"use client";

import { usePathname } from "next/navigation";
import Header from "./GeneralComponents/Header/Header";
import HeaderWhite from "./GeneralComponents/Header/HeaderWhite";
import Footer from "./GeneralComponents/Footer/Footer";
import BookNow from "./GeneralComponents/BookNow";
import CookiePopup from "./GeneralComponents/CookiePopup";
import { SharedMediaProvider } from "./SharedMediaContext";

export default function ClientLayoutWrapper({
  children,
  dynamicNavigation = [],
  sharedMedia,
}) {
  const pathname = usePathname();

  const isPanelRoute =
    pathname.includes("/panel") || pathname.includes("/kullanici");

  return (
    <SharedMediaProvider value={sharedMedia}>
      {!isPanelRoute && <Header dynamicNavigation={dynamicNavigation} />}
      {!isPanelRoute && <HeaderWhite dynamicNavigation={dynamicNavigation} />}
      {children}
      {!isPanelRoute && <BookNow />}
      {!isPanelRoute && <CookiePopup />}
      {!isPanelRoute && <Footer />}
    </SharedMediaProvider>
  );
}
