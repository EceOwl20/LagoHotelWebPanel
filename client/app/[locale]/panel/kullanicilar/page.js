"use client";

import { useCallback, useEffect, useState } from "react";
import { usePanelSession } from "../PanelSessionContext";

const emptyForm = { username: "", displayName: "", password: "", role: "editor" };

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
    return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Kullanıcı yönetimi yalnızca yöneticilere açıktır.</p>;
  }

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Yetkilendirme</p>
        <h1 className="text-3xl font-semibold text-stone-900">Panel kullanıcıları</h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">Yöneticiler yayınlama, silme ve kullanıcı yönetimi yapabilir. Editörler içerik ve sayfa taslaklarını düzenleyebilir.</p>
      </header>

      {error || message ? <p role="status" className={`rounded-xl border p-4 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-stone-900">Kayıtlı kullanıcılar</h2><span className="text-xs text-stone-500">{users.length} hesap</span></div>
          {loading ? <p className="text-sm text-stone-500">Kullanıcılar yükleniyor...</p> : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-6 text-stone-600">Henüz panelden oluşturulmuş kullanıcı yok. Ortam değişkenleriyle tanımlı sistem yöneticisi güvenli giriş hesabı olarak çalışmaya devam eder.</div>
          ) : (
            <div className="space-y-3">{users.map((user) => (
              <article key={user.id} className="flex flex-col gap-4 rounded-xl border border-stone-200 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div><div className="font-semibold text-stone-900">{user.displayName}</div><div className="mt-1 text-sm text-stone-500">@{user.username}</div></div>
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label={`${user.username} rolü`} value={user.role} onChange={(event) => updateUser(user, { role: event.target.value })} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"><option value="editor">Editör</option><option value="admin">Yönetici</option></select>
                  <button type="button" onClick={() => updateUser(user, { active: !user.active })} className={`rounded-lg px-3 py-2 text-sm font-medium ${user.active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{user.active ? "Aktif" : "Pasif"}</button>
                  <button type="button" onClick={() => { setPasswordUserId(passwordUserId === user.id ? null : user.id); setReplacementPassword(""); }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700">Parolayı yenile</button>
                </div>
                {passwordUserId === user.id ? (
                  <div className="flex w-full flex-col gap-2 border-t border-stone-200 pt-3 sm:flex-row">
                    <input type="password" value={replacementPassword} onChange={(event) => setReplacementPassword(event.target.value)} placeholder="Yeni parola (en az 10 karakter)" autoComplete="new-password" className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                    <button type="button" disabled={replacementPassword.length < 10} onClick={() => updateUser(user, { password: replacementPassword })} className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Parolayı kaydet</button>
                  </div>
                ) : null}
              </article>
            ))}</div>
          )}
        </div>

        <form onSubmit={createUser} className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Yeni kullanıcı</h2>
          <UserInput label="Ad soyad" value={form.displayName} onChange={(displayName) => setForm({ ...form, displayName })} />
          <UserInput label="Kullanıcı adı" value={form.username} onChange={(username) => setForm({ ...form, username })} autoComplete="username" />
          <UserInput label="Parola" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} autoComplete="new-password" hint="En az 10 karakter" />
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-xl border border-stone-300 bg-white px-4 py-3 font-normal"><option value="editor">Editör</option><option value="admin">Yönetici</option></select></label>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{saving ? "Oluşturuluyor..." : "Kullanıcı oluştur"}</button>
        </form>
      </section>
    </div>
  );
}

function UserInput({ label, hint, type = "text", value, onChange, autoComplete }) {
  return <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required className="rounded-xl border border-stone-300 px-4 py-3 font-normal" />{hint ? <span className="text-xs font-normal text-stone-500">{hint}</span> : null}</label>;
}
