"use client";

import { FiBell, FiSearch } from "react-icons/fi";

export default function TopBar({ user }) {
  return (
    <header
      className="
        fixed top-0 right-0 z-30
        flex h-16 items-center justify-between
        border-b border-stone-200 bg-white px-4 shadow-sm

        left-0
        md:left-72
        md:px-8
      "
    >
      <div>
        <h1 className="text-lg font-semibold text-stone-900">
          Yönetim Paneli
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Ara"
          className="text-stone-500 transition hover:text-stone-900"
        >
          <FiSearch className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Bildirimler"
          className="text-stone-500 transition hover:text-stone-900"
        >
          <FiBell className="h-5 w-5" />
        </button>

        <div className="text-right">
          <div className="text-sm font-medium text-stone-700">
            {user?.displayName || user?.username || "admin"}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400">
            {user?.role === "editor" ? "Editör" : "Yönetici"}
          </div>
        </div>
      </div>
    </header>
  );
}
