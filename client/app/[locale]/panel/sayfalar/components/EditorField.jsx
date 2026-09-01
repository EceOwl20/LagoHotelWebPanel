export default function EditorField({ label, value, onChange, textarea = false, hint }) {
  const className =
    "rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-600";

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {textarea ? (
        <textarea
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className={`${className} min-h-[120px] resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
      {hint ? <span className="text-xs leading-5 text-stone-500">{hint}</span> : null}
    </label>
  );
}
