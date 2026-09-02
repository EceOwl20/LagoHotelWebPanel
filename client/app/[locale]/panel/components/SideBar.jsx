"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import logo from "../../GeneralComponents/Header/Icons/Asset2.svg"
import Image from "next/image";
import { FiLogOut } from "react-icons/fi";
import { FiTable } from "react-icons/fi";
import { FiFile } from "react-icons/fi";
import { FiLayers } from "react-icons/fi";
import { FiFilm } from "react-icons/fi";
// import { FiSlack } from "react-icons/fi";
// import { FiGrid } from "react-icons/fi";
import { FiPackage } from "react-icons/fi";


const navigationItems = [
  { href: "/panel/dashboard", label: "Dashboard", icon: FiTable},
  { href: "/panel/sayfalar", label: "Sayfalar", icon: FiFile },
  { href: "/panel/icerikler", label: "Sayfa Icerikleri", icon: FiLayers },
  { href: "/panel/galeri", label: "Galeri", icon: FiFilm },
  { href: "/panel/blog", label: "Blog", icon: FiPackage },
];

export default function SideBar({ username }) {
  const router = useRouter();
  const params = useParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Çıkış işlemi tamamlanamadı.");
      }

      router.replace(`/${params.locale}/panel/login`);
      router.refresh();
    } catch (error) {
      setLogoutError(error.message);
      setLoggingOut(false);
    }
  };

  return (
    <aside className="flex min-h-screen w-full flex-col justify-between border-r border-stone-200 bg-stone-950 px-6 py-8 text-stone-100 md:w-72">
      <div className="space-y-8">
        <div className="space-y-2">
         <div className="flex flex-col gap-2">
           <Image
                          src={logo}
                          alt="Logo"
                          className="object-contain w-[62px] h-[46px] items-center justify-center"
                        />
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Lago Panel
          </div>
         </div>
          <div className="text-2xl font-semibold">Icerik Yonetimi</div>
          <div className="text-sm text-stone-400">
            Giris yapan kullanici: {username || "admin"}
          </div>
        </div>

        <nav className="space-y-2">
  {navigationItems.map((item) => {
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className="group flex items-center gap-3 rounded-xl border border-stone-800 px-4 py-3 text-sm transition hover:border-stone-600 hover:bg-stone-900"
      >
        <Icon
          className="h-5 w-5 shrink-0 text-stone-400 transition group-hover:text-stone-100"
          aria-hidden="true"
        />

        <span>{item.label}</span>
      </Link>
    );
  })}
</nav>
      </div>

      <div className="space-y-3">
        {logoutError ? (
          <p role="alert" className="text-xs leading-5 text-rose-200">
            {logoutError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-3 w-[70%] rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"} <FiLogOut />
        </button>
      </div>
    </aside>
  );
}
