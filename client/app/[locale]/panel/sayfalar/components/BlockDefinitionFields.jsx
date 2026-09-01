import CardArrayField from "./CardArrayField";
import EditorField from "./EditorField";
import ImageArrayField from "./ImageArrayField";
import PageImagePicker from "./PageImagePicker";

const AUTOMATIC_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "image",
  "select",
  "imageArray",
  "boolean",
  "cardArray",
]);

function DefinitionField({ field, value, locale, onChange }) {
  if (field.type === "image") {
    return (
      <PageImagePicker
        label={field.label}
        value={value}
        onChange={onChange}
        hint={field.description}
      />
    );
  }

  if (field.type === "select") {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-stone-700">{field.label}</span>
        <select
          value={value ?? field.options[0]?.value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-600"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.description ? (
          <span className="text-xs leading-5 text-stone-500">{field.description}</span>
        ) : null}
      </label>
    );
  }

  if (field.type === "imageArray") {
    return <ImageArrayField field={field} value={value} locale={locale} onChange={onChange} />;
  }

  if (field.type === "cardArray") {
    return <CardArrayField field={field} value={value} locale={locale} onChange={onChange} />;
  }

  if (field.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
        <input
          type="checkbox"
          checked={value ?? field.defaultValue ?? false}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        {field.label}
      </label>
    );
  }

  return (
    <EditorField
      label={field.label}
      value={value}
      onChange={onChange}
      textarea={field.type === "textarea"}
      hint={field.description}
    />
  );
}

export default function BlockDefinitionFields({
  definition,
  section,
  locale,
  onTranslationChange,
  onFieldChange,
}) {
  return definition.fields
    .filter((field) => AUTOMATIC_FIELD_TYPES.has(field.type))
    .map((field) => {
      const value = field.localized
        ? section.translations?.[locale]?.[field.name]
        : section[field.name];
      const handleChange = field.localized ? onTranslationChange : onFieldChange;

      return (
        <DefinitionField
          key={field.name}
          field={field}
          value={value}
          locale={locale}
          onChange={(nextValue) => handleChange(field.name, nextValue)}
        />
      );
    });
}
