"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { FiArrowRight, FiImage, FiLogOut } from "react-icons/fi";
import { usePanelSession } from "../PanelSessionContext";

const hotels = [
  {
    id: "lago",
    name: "Lago Hotel",
    eyebrow: "TAM PANEL",
    description: "Sayfalar, içerikler, medya, galeri, blog ve kullanıcı yönetimi.",
    href: "/panel/dashboard",
    initial: "L",
    accent: "bg-[#2f423f]",
    icon: FiArrowRight,
  },
  {
    id: "azura",
    name: "Azura Deluxe Hotel",
    eyebrow: "PİLOT BAĞLANTI",
    description: "Şimdilik anasayfadaki karşılama, tanıtım ve olanaklar bölümleri yönetilebilir.",
    href: "/panel/azura/icerikler",
    initial: "A",
    accent: "bg-[#356b70]",
    icon: FiImage,
  },
];

export default function HotelPickerPage() {
  const router = useRouter();
  const user = usePanelSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Çıkış işlemi tamamlanamadı.");
      router.replace("/panel/login");
      router.refresh();
    } catch (cause) {
      setError(cause.message);
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#507f78]">Ortak yönetim paneli</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">Hangi oteli yöneteceksiniz?</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Hoş geldiniz, {user?.displayName || user?.username || "yönetici"}. İçerikleri görüntülemek için bir otel seçin.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          <FiLogOut className="h-4 w-4" />
          {loggingOut ? "Çıkış yapılıyor..." : "Çıkış yap"}
        </button>
      </div>

      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        {hotels.map((hotel) => {
          const Icon = hotel.icon;
          return (
            <Link
              key={hotel.id}
              href={hotel.href}
              className="group flex min-h-64 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#63978f] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#63978f]"
            >
              <div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${hotel.accent} text-2xl font-semibold text-white`} aria-hidden="true">
                  {hotel.initial}
                </div>
                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#507f78]">{hotel.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-semibold text-stone-900">{hotel.name}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{hotel.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2f423f] group-hover:gap-3">
                Panele geç <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-xs leading-5 text-stone-500">
        Azura için diğer sayfalar henüz bu panele bağlanmadı. Otel seçimi bir erişim yetkisi değil, hangi otelin ekranlarında olduğunuzu gösteren gezinme adımıdır.
      </p>
    </div>
  );
}
