"use client";

export default function PageEditLockNotice({
  status,
  lock,
  error,
  canOverride,
  onRetry,
  onTakeover,
}) {
  if (status === "not-required") return null;

  if (status === "owned") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Düzenleme kilidi sizde. Bu ekran açık kaldığı sürece kilit otomatik yenilenir.
      </div>
    );
  }

  if (status === "acquiring") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600 shadow-sm">
        Düzenleme kilidi kontrol ediliyor…
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">Bu sayfa şu anda düzenleniyor.</p>
        <p className="mt-1 leading-6">
          {lock?.displayName || "Başka bir kullanıcı"} düzenlemeyi tamamlayana kadar
          içerik salt okunur gösteriliyor. Kilit durumu otomatik kontrol edilir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
          >
            Şimdi Kontrol Et
          </button>
          {canOverride ? (
            <button
              type="button"
              onClick={onTakeover}
              className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-200"
            >
              Kilidi Devral
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
      <p>{error || "Düzenleme kilidi doğrulanamadı."}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold hover:bg-rose-100"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
