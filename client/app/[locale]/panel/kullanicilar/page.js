"use client";

import { useCallback, useEffect, useState } from "react";
import { usePanelSession } from "../PanelSessionContext";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiKey,
  FiSave,
  FiShield,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
} from "react-icons/fi";

const emptyForm = { username: "", displayName: "", password: "", role: "editor" };

const statTones = {
  stone: "bg-stone-100 text-stone-700",
  emerald: "bg-emerald-100 text-emerald-700",
  accent: "bg-[#edf5f3] text-[#507f78]",
};

function getInitials(name, username) {
  const source = String(name || username || "K").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function StatCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${statTones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold text-stone-900">{value}</p>
        <p className="text-xs text-stone-500">{label}</p>
      </div>
    </div>
  );
}

function UserCard({
  user,
  isCurrentUser,
  passwordOpen,
  replacementPassword,
  onReplacementPasswordChange,
  onUpdate,
  onTogglePassword,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-[#63978f]/60 hover:shadow-sm">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2f423f] text-sm font-semibold text-white">
            {getInitials(user.displayName, user.username)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-stone-900">{user.displayName}</h3>
              {isCurrentUser ? (
                <span className="rounded-full bg-[#edf5f3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#507f78]">
                  Siz
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-stone-500">@{user.username}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={`${user.username} rolü`}
            value={user.role}
            onChange={(event) => onUpdate(user, { role: event.target.value })}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-700 outline-none transition focus:border-[#63978f] focus:bg-white"
          >
            <option value="editor">Editör</option>
            <option value="admin">Yönetici</option>
          </select>
          <button
            type="button"
            onClick={() => onUpdate(user, { active: !user.active })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
              user.active
                ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {user.active ? (
              <FiUserCheck className="h-3.5 w-3.5" />
            ) : (
              <FiUserX className="h-3.5 w-3.5" />
            )}
            {user.active ? "Aktif" : "Pasif"}
          </button>
          <button
            type="button"
            onClick={onTogglePassword}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              passwordOpen
                ? "border-[#63978f] bg-[#edf5f3] text-[#2f423f]"
                : "border-stone-300 text-stone-700 hover:border-[#63978f] hover:bg-[#edf5f3]"
            }`}
          >
            <FiKey className="h-3.5 w-3.5" />
            Parolayı yenile
          </button>
        </div>
      </div>

      {passwordOpen ? (
        <div className="flex flex-col gap-3 border-t border-stone-200 bg-stone-50/80 p-4 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{user.username} için yeni parola</span>
            <input
              type="password"
              value={replacementPassword}
              onChange={(event) => onReplacementPasswordChange(event.target.value)}
              placeholder="Yeni parola (en az 10 karakter)"
              autoComplete="new-password"
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#edf5f3]"
            />
          </label>
          <button
            type="button"
            disabled={replacementPassword.length < 10}
            onClick={() => onUpdate(user, { password: replacementPassword })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiSave className="h-4 w-4" />
            Parolayı kaydet
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function UsersPage() {
  const sessionUser = usePanelSession();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [replacementPassword, setReplacementPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const activeUserCount = users.filter((user) => user.active).length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Kullanıcılar alınamadı.");
    setUsers(payload.users || []);
  }, []);

  useEffect(() => {
    if (sessionUser?.role !== "admin") {
      setLoading(false);
      return;
    }

    loadUsers().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [loadUsers, sessionUser?.role]);

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: form }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Kullanıcı oluşturulamadı.");
      setForm(emptyForm);
      await loadUsers();
      setPasswordUserId(null);
      setReplacementPassword("");
      setMessage("Kullanıcı oluşturuldu.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user, changes) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: changes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Kullanıcı güncellenemedi.");
      await loadUsers();
      setMessage("Kullanıcı güncellendi. Yetki veya durum değiştiyse açık oturumları kapatıldı.");
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  if (sessionUser?.role !== "admin") {
    return (
      <div className="mx-auto flex max-w-2xl items-start gap-4 rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <FiShield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Erişim kısıtlandı</h1>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Kullanıcı yönetimi yalnızca yöneticilere açıktır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-[#2f423f] px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">
              Yetkilendirme / Kullanıcılar
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Panel kullanıcıları
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">
              Ekip hesaplarını, erişim rollerini ve oturum güvenliğini tek alandan yönetin.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-stone-100 backdrop-blur-sm">
            <FiShield className="h-4 w-4 text-[#a9c9c4]" />
            Yalnızca yönetici erişimi
          </span>
        </div>
      </header>

      {!loading ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={FiUsers} value={users.length} label="Toplam hesap" tone="stone" />
          <StatCard icon={FiUserCheck} value={activeUserCount} label="Aktif kullanıcı" tone="emerald" />
          <StatCard icon={FiShield} value={adminCount} label="Yönetici" tone="accent" />
        </section>
      ) : null}

      {error || message ? (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error ? (
            <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <span>{error || message}</span>
        </div>
      ) : null}

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f423f] text-white">
                <FiUsers className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Kayıtlı kullanıcılar</h2>
                <p className="mt-0.5 text-xs text-stone-500">Rol, durum ve parola yönetimi</p>
              </div>
            </div>
            <span className="rounded-full bg-[#edf5f3] px-3 py-1.5 text-xs font-semibold text-[#507f78]">
              {users.length} hesap
            </span>
          </div>

          <div className="p-5 md:p-6">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#63978f]/50 bg-[#edf5f3]/40 px-6 py-10 text-center">
              <FiUsers className="h-8 w-8 text-[#507f78]" />
              <h3 className="mt-4 font-semibold text-stone-900">Henüz kayıtlı kullanıcı yok</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                Ortam değişkenleriyle tanımlı sistem yöneticisi güvenli giriş hesabı
                olarak çalışmaya devam eder.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isCurrentUser={user.username === sessionUser?.username}
                  passwordOpen={passwordUserId === user.id}
                  replacementPassword={replacementPassword}
                  onReplacementPasswordChange={setReplacementPassword}
                  onUpdate={updateUser}
                  onTogglePassword={() => {
                    setPasswordUserId(passwordUserId === user.id ? null : user.id);
                    setReplacementPassword("");
                  }}
                />
              ))}
            </div>
          )}
          </div>
        </div>

        <form onSubmit={createUser} className="h-fit overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-stone-200 bg-[#edf5f3]/70 px-5 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#63978f] text-white">
              <FiUserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Yeni kullanıcı</h2>
              <p className="mt-0.5 text-xs text-stone-500">Yeni bir panel hesabı tanımlayın</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
          <UserInput label="Ad soyad" value={form.displayName} onChange={(displayName) => setForm({ ...form, displayName })} />
          <UserInput label="Kullanıcı adı" value={form.username} onChange={(username) => setForm({ ...form, username })} autoComplete="username" />
          <UserInput label="Parola" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} autoComplete="new-password" hint="En az 10 karakter" />
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            Rol
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 font-normal outline-none transition focus:border-[#63978f] focus:bg-white focus:ring-4 focus:ring-[#edf5f3]">
              <option value="editor">Editör</option>
              <option value="admin">Yönetici</option>
            </select>
          </label>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#3c5551] disabled:opacity-60">
            <FiUserPlus className="h-4 w-4" />
            {saving ? "Oluşturuluyor..." : "Kullanıcı oluştur"}
          </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function UserInput({ label, hint, type = "text", value, onChange, autoComplete }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 font-normal outline-none transition focus:border-[#63978f] focus:bg-white focus:ring-4 focus:ring-[#edf5f3]"
      />
      {hint ? <span className="text-xs font-normal text-stone-500">{hint}</span> : null}
    </label>
  );
}
