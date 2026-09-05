"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Sidebar from "./components/SideBar.jsx";
import TopBar from "./components/TopBar.jsx";

export default function PanelLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });

  const hideSidebar = pathname.includes("/panel/login");

  useEffect(() => {
    if (hideSidebar) {
      setAuthState({ loading: false, authenticated: false, user: null });
      return;
    }

    let isCancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        });

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
          setAuthState({ loading: false, authenticated: false, user: null });
          router.replace(`/${params.locale}/panel/login`);
        }
      }
    };

    loadSession();

    return () => {
      isCancelled = true;
    };
  }, [hideSidebar, params.locale, router]);

  if (!hideSidebar && authState.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600 shadow-sm">
          Panel oturumu kontrol ediliyor...
        </div>
      </div>
    );
  }

  if (!hideSidebar && !authState.authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-100 md:flex">
      {!hideSidebar && <><Sidebar username={authState.user?.username} />  <TopBar username={authState.user?.username} /></>}
      <main className={`flex-1 p-4 md:p-8 ${hideSidebar ? "w-full"   : "pt-20 md:ml-72 md:pt-24"}`}>
        {children}
      </main>
    </div>
  );
}
