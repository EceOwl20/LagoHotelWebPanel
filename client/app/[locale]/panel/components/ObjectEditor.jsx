"use client";

const fieldLabels = {
  header: "Başlık",
  title: "Başlık",
  subtitle: "Alt başlık",
  text: "Metin",
  description: "Açıklama",
  buttonText: "Buton metni",
  checkin: "Giriş saati",
  checkout: "Çıkış saati",
  view: "Manzara",
  m: "Oda alanı",
};

function updateValueAtPath(source, path, nextValue) {
  if (path.length === 0) {
    return nextValue;
  }

  const [head, ...rest] = path;
  const clone = Array.isArray(source) ? [...source] : { ...source };
  clone[head] = updateValueAtPath(clone[head], rest, nextValue);
  return clone;
}

function humanizeLabel(label) {
  if (fieldLabels[label]) {
    return fieldLabels[label];
  }

  const numberedField = label.match(/^(buttonText|title|subtitle|text|description|feature|desc|list)(\d+)$/);

  if (numberedField) {
    const baseLabels = {
      buttonText: "Buton metni",
      title: "Başlık",
      subtitle: "Alt başlık",
      text: "Metin",
      description: "Açıklama",
      feature: "Özellik",
      desc: "Özellik açıklaması",
      list: "Liste maddesi",
    };
    return `${baseLabels[numberedField[1]]} ${numberedField[2]}`;
  }

  const roomSection = label.match(/^RoomSection(\d+)$/);

  if (roomSection) {
    return `Oda bölümü ${roomSection[1]}`;
  }

  const words = label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : label;
}

function FieldHeading({ label }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-sm font-semibold text-stone-800">{humanizeLabel(label)}</span>
      <span className="font-mono text-[10px] text-stone-400">{label}</span>
    </span>
  );
}

function EditorNode({ label, value, path, onChange }) {
  if (typeof value === "string") {
    const isLongText =
      value.length > 80 ||
      value.includes("\n") ||
      /^(text|description|desc)\d*$/i.test(label);

    return (
      <label
        className={`flex min-w-0 flex-col gap-2 ${isLongText ? "lg:col-span-2" : ""}`}
      >
        <FieldHeading label={label} />
        {isLongText ? (
          <textarea
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            rows={5}
            className="min-h-[118px] resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-700 focus:ring-4 focus:ring-stone-100"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-700 focus:ring-4 focus:ring-stone-100"
          />
        )}
      </label>
    );
  }

  if (Array.isArray(value)) {
    return (
      <section className="col-span-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <SectionHeading label={label} detail={`${value.length} öğe`} />
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {value.map((item, index) => (
            <EditorNode
              key={`${label}-${index}`}
              label={`${label} ${index + 1}`}
              value={item}
              path={[...path, index]}
              onChange={onChange}
            />
          ))}
        </div>
      </section>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);

    return (
      <section className="col-span-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <SectionHeading label={label} detail={`${entries.length} alan`} />
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {entries.map(([key, childValue]) => (
            <EditorNode
              key={`${label}-${key}`}
              label={key}
              value={childValue}
              path={[...path, key]}
              onChange={onChange}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <label className="flex min-w-0 flex-col gap-2">
      <FieldHeading label={label} />
      <input
        type="text"
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(path, event.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-700 focus:ring-4 focus:ring-stone-100"
      />
    </label>
  );
}

function SectionHeading({ label, detail }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-[#2f423f] px-5 py-4">
      <div>
        <h3 className="font-semibold text-stone-100">{humanizeLabel(label)}</h3>
        <p className="mt-0.5 font-mono text-[10px] text-stone-400">{label}</p>
      </div>
      <span className="shrink-0 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500">
        {detail}
      </span>
    </div>
  );
}

export default function ObjectEditor({ value, onChange }) {
  const handleChange = (path, nextValue) => {
    onChange((currentValue) => updateValueAtPath(currentValue, path, nextValue));
  };
  const entries = Object.entries(value || {});
  const simpleEntries = entries.filter(([, childValue]) => {
    return !childValue || typeof childValue !== "object";
  });
  const sectionEntries = entries.filter(([, childValue]) => {
    return childValue && typeof childValue === "object";
  });

  return (
    <div className="space-y-5">
      {simpleEntries.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <SectionHeading label="Genel alanlar" detail={`${simpleEntries.length} alan`} />
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            {simpleEntries.map(([key, childValue]) => (
              <EditorNode
                key={key}
                label={key}
                value={childValue}
                path={[key]}
                onChange={handleChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {sectionEntries.map(([key, childValue]) => (
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
