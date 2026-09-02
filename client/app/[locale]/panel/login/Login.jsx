"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const isProduction = process.env.NODE_ENV === "production";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const checkSession = async () => {
      const response = await fetch("/api/admin/session", { cache: "no-store" });

      if (!isCancelled && response.ok) {
        router.replace(`/${params.locale}/panel/dashboard`);
      }
    };

    checkSession();

    return () => {
      isCancelled = true;
    };
  }, [params.locale, router]);

  useEffect(() => {
    if (retryAfter <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setRetryAfter((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [retryAfter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfterHeader = Number(res.headers.get("Retry-After"));
          setRetryAfter(
            Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
              ? retryAfterHeader
              : 60
          );
        }

        throw new Error(data.error || "Giriş başarısız");
      }

      router.replace(`/${params.locale}/panel/dashboard`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#292524,_#0c0a09_55%)] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            Lago Hotel
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">Panel Girisi</h1>
          <p className="text-sm text-stone-500">
            Sayfa iceriklerini, galeriyi ve blog yazilarini yonetmek icin giris yapin.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-700">Kullanici adi</span>
          <input
            type="text"
            placeholder="Kullanici adiniz"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-700">Sifre</span>
          <input
            type="password"
            placeholder="Sifreniz"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || retryAfter > 0}
          className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading
            ? "Giris yapiliyor..."
            : retryAfter > 0
              ? `${retryAfter} sn sonra tekrar deneyin`
              : "Panele Gir"}
        </button>

        {!isProduction ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Varsayilan giris bilgisi sadece gelistirme ortami icin `admin / admin123`.
            Canli ortamda `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` ve
            `ADMIN_SESSION_SECRET` degiskenlerini tanimlamalisin.
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
            Canli panel erisimi icin sunucuda `ADMIN_USERNAME`,
            `ADMIN_PASSWORD_HASH` ve `ADMIN_SESSION_SECRET` tanimli olmali.
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
