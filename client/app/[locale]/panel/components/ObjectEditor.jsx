"use client";

function updateValueAtPath(source, path, nextValue) {
  if (path.length === 0) {
    return nextValue;
  }

  const [head, ...rest] = path;
  const clone = Array.isArray(source) ? [...source] : { ...source };
  clone[head] = updateValueAtPath(clone[head], rest, nextValue);
  return clone;
}

function EditorNode({ label, value, path, onChange }) {
  if (typeof value === "string") {
    const isLongText = value.length > 80 || value.includes("\n");

    return (
      <label className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {isLongText ? (
          <textarea
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            rows={6}
            className="min-h-[120px] rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
          />
        )}
      </label>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </div>
        {value.map((item, index) => (
          <EditorNode
            key={`${label}-${index}`}
            label={`${label} #${index + 1}`}
            value={item}
            path={[...path, index]}
            onChange={onChange}
          />
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </div>
        {Object.entries(value).map(([key, childValue]) => (
          <EditorNode
            key={`${label}-${key}`}
            label={key}
            value={childValue}
            path={[...path, key]}
            onChange={onChange}
          />
        ))}
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        type="text"
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(path, event.target.value)}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
      />
    </label>
  );
}

export default function ObjectEditor({ value, onChange }) {
  const handleChange = (path, nextValue) => {
    onChange((currentValue) => updateValueAtPath(currentValue, path, nextValue));
  };

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(value || {}).map(([key, childValue]) => (
        <EditorNode
          key={key}
          label={key}
          value={childValue}
          path={[key]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
