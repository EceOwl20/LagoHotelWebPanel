"use client";

import { useParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

const navigationItems = [
  { href: "/panel/dashboard", label: "Dashboard" },
  { href: "/panel/sayfalar", label: "Sayfalar" },
  { href: "/panel/icerikler", label: "Sayfa Icerikleri" },
  { href: "/panel/galeri", label: "Galeri" },
  { href: "/panel/blog", label: "Blog" },
];

export default function SideBar({ username }) {
  const router = useRouter();
  const params = useParams();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace(`/${params.locale}/panel/login`);
    router.refresh();
  };

  return (
    <aside className="flex min-h-screen w-full flex-col justify-between border-r border-stone-200 bg-stone-950 px-6 py-8 text-stone-100 md:w-72">
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Lago Panel
          </div>
          <div className="text-2xl font-semibold">Icerik Yonetimi</div>
          <div className="text-sm text-stone-400">
            Giris yapan kullanici: {username || "admin"}
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl border border-stone-800 px-4 py-3 text-sm transition hover:border-stone-600 hover:bg-stone-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
      >
        Cikis Yap
      </button>
    </aside>
  );
}
