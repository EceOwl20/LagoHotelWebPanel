"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
} from "next/navigation";
import Sidebar from "./components/SideBar.jsx";
import TopBar from "./components/TopBar.jsx";
import {
  PanelSessionProvider,
  PanelHotelProvider,
} from "./PanelSessionContext.jsx";

export default function PanelLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });

  const [selectedHotel, setSelectedHotel] = useState(null);

  const isLoginPage = pathname.includes("/panel/login");
  const isHotelPicker = pathname.includes("/panel/oteller");
  const isUsersPage = pathname.includes("/panel/kullanicilar");

  const isSharedRoute =
    isHotelPicker ||
    isUsersPage;

  const isAzuraRoute =
    pathname.includes("/panel/azura");

  const isLagoRoute =
    pathname.includes("/panel/") &&
    !isLoginPage &&
    !isSharedRoute &&
    !isAzuraRoute;

  const userSites = Array.isArray(authState.user?.sites)
    ? authState.user.sites
    : [];

  const canAccessLago = userSites.includes("lago");
  const canAccessAzura = userSites.includes("azura");

  const showPanelChrome =
    !isLoginPage &&
    !isHotelPicker;

  const selectHotel = (hotel) => {
    if (hotel !== "lago" && hotel !== "azura") {
      return;
    }

    if (
      authState.authenticated &&
      !userSites.includes(hotel)
    ) {
      return;
    }

    sessionStorage.setItem(
      "panel:selectedHotel",
      hotel
    );

    setSelectedHotel(hotel);
  };

  /*
   * Session kontrolü
   */
  useEffect(() => {
    if (isLoginPage) {
      setAuthState({
        loading: false,
        authenticated: false,
        user: null,
      });

      return;
    }

    let isCancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch(
          "/api/admin/session",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("SESSION_REQUIRED");
        }

        const data = await response.json();

        if (!isCancelled) {
          setAuthState({
            loading: false,
            authenticated: true,
            user: data.user,
          });
        }
      } catch {
        if (!isCancelled) {
          setAuthState({
            loading: false,
            authenticated: false,
            user: null,
          });

          router.replace(
            `/${params.locale}/panel/login`
          );
        }
      }
    };

    loadSession();

    return () => {
      isCancelled = true;
    };
  }, [
    isLoginPage,
    params.locale,
    router,
  ]);

  /*
   * Otel seçimini URL ile senkronize et.
   *
   * Shared route'larda mevcut seçim korunur.
   */
  useEffect(() => {
    if (
      authState.loading ||
      !authState.authenticated ||
      isLoginPage
    ) {
      return;
    }

    if (isAzuraRoute && canAccessAzura) {
      sessionStorage.setItem(
        "panel:selectedHotel",
        "azura"
      );

      setSelectedHotel("azura");
      return;
    }

    if (isLagoRoute && canAccessLago) {
      sessionStorage.setItem(
        "panel:selectedHotel",
        "lago"
      );

      setSelectedHotel("lago");
      return;
    }

    if (isSharedRoute) {
      const storedHotel =
        sessionStorage.getItem(
          "panel:selectedHotel"
        );

      if (
        storedHotel === "lago" &&
        canAccessLago
      ) {
        setSelectedHotel("lago");
        return;
      }

      if (
        storedHotel === "azura" &&
        canAccessAzura
      ) {
        setSelectedHotel("azura");
        return;
      }

      if (canAccessLago) {
        setSelectedHotel("lago");
        return;
      }

      if (canAccessAzura) {
        setSelectedHotel("azura");
      }
    }
  }, [
    authState.loading,
    authState.authenticated,
    isLoginPage,
    isAzuraRoute,
    isLagoRoute,
    isSharedRoute,
    canAccessLago,
    canAccessAzura,
  ]);

  /*
   * Hotel route guard
   */
  useEffect(() => {
    if (
      authState.loading ||
      !authState.authenticated ||
      isLoginPage ||
      isSharedRoute
    ) {
      return;
    }

    /*
     * Lago kullanıcısı Azura URL'sine girmeye
     * çalışıyorsa Lago dashboard'a gönder.
     */
    if (
      isAzuraRoute &&
      !canAccessAzura
    ) {
      if (canAccessLago) {
        sessionStorage.setItem(
          "panel:selectedHotel",
          "lago"
        );

        setSelectedHotel("lago");

        router.replace(
          `/${params.locale}/panel/dashboard`
        );

        return;
      }

      router.replace(
        `/${params.locale}/panel/oteller`
      );

      return;
    }

    /*
     * Azura kullanıcısı Lago URL'sine girmeye
     * çalışıyorsa Azura dashboard'a gönder.
     */
    if (
      isLagoRoute &&
      !canAccessLago
    ) {
      if (canAccessAzura) {
        sessionStorage.setItem(
          "panel:selectedHotel",
          "azura"
        );

        setSelectedHotel("azura");

        router.replace(
          `/${params.locale}/panel/azura/dashboard`
        );

        return;
      }

      router.replace(
        `/${params.locale}/panel/oteller`
      );
    }
  }, [
    authState.loading,
    authState.authenticated,
    isLoginPage,
    isSharedRoute,
    isAzuraRoute,
    isLagoRoute,
    canAccessLago,
    canAccessAzura,
    params.locale,
    router,
  ]);

  /*
   * Yetkisiz hotel route'unu redirect gerçekleşene
   * kadar render etme.
   */
  const hasRouteAccess =
    isLoginPage ||
    isSharedRoute ||
    !authState.authenticated ||
    (!isAzuraRoute && !isLagoRoute) ||
    (isAzuraRoute && canAccessAzura) ||
    (isLagoRoute && canAccessLago);

  if (!isLoginPage && authState.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600 shadow-sm">
          Panel oturumu kontrol ediliyor...
        </div>
      </div>
    );
  }

  if (
    !isLoginPage &&
    !authState.authenticated
  ) {
    return null;
  }

  if (
    !isLoginPage &&
    authState.authenticated &&
    !hasRouteAccess
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600 shadow-sm">
          Yetkili olduğunuz otele yönlendiriliyorsunuz...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 md:flex">
      <PanelSessionProvider user={authState.user}>
        <PanelHotelProvider
          value={{
            selectedHotel,
            selectHotel,
          }}
        >
          {showPanelChrome && (
            <>
              <Sidebar user={authState.user} />
              <TopBar user={authState.user} />
            </>
          )}

          <main
            className={`flex-1 p-4 md:p-8 ${
              showPanelChrome
                ? "pt-20 md:ml-72 md:pt-24"
                : "w-full"
            }`}
          >
            {children}
          </main>
        </PanelHotelProvider>
      </PanelSessionProvider>
    </div>
  );
}