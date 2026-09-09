import CardArrayField from "./CardArrayField";
import EditorField from "./EditorField";
import ImageArrayField from "./ImageArrayField";
import OtherOptionArrayField from "./OtherOptionArrayField";
import PageImagePicker from "./PageImagePicker";

const AUTOMATIC_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "image",
  "select",
  "imageArray",
  "boolean",
  "cardArray",
  "otherOptionArray",
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

  if (field.type === "otherOptionArray") {
    return (
      <OtherOptionArrayField
        field={field}
        value={value}
        locale={locale}
        onChange={onChange}
      />
    );
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
  const fields = definition.fields.filter((field) =>
    AUTOMATIC_FIELD_TYPES.has(field.type)
  );

  const renderField = (field, grouped = false) => {
    const value = field.localized
      ? section.translations?.[locale]?.[field.name]
      : section[field.name];
    const handleChange = field.localized ? onTranslationChange : onFieldChange;
    const isCollection = ["imageArray", "cardArray", "otherOptionArray"].includes(
      field.type
    );
    const spansFullRow = isCollection || ["image", "textarea"].includes(field.type);

    return (
      <div
        key={field.name}
        className={`${isCollection ? "w-full" : spansFullRow ? "max-w-4xl" : "max-w-3xl"} ${
          grouped && spansFullRow ? "lg:col-span-2" : ""
        }`}
      >
        <DefinitionField
          field={field}
          value={value}
          locale={locale}
          onChange={(nextValue) => handleChange(field.name, nextValue)}
        />
      </div>
    );
  };

  if (!Array.isArray(definition.panelGroups) || definition.panelGroups.length === 0) {
    return fields.map((field) => renderField(field));
  }

  const definedGroupIds = new Set(definition.panelGroups.map((group) => group.id));
  const ungroupedFields = fields.filter(
    (field) => !field.panelGroup || !definedGroupIds.has(field.panelGroup)
  );

  return (
    <div className="space-y-4">
      {definition.panelGroups.map((group, index) => {
        const groupFields = fields.filter((field) => field.panelGroup === group.id);

        if (groupFields.length === 0) return null;

        return (
          <section
            key={group.id}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="flex items-start gap-3 border-b border-stone-200 bg-[#edf5f3]/60 px-4 py-3.5 md:px-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2f423f] text-[11px] font-semibold text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h4 className="text-sm font-semibold text-stone-900">{group.label}</h4>
                {group.description ? (
                  <p className="mt-0.5 text-xs leading-5 text-stone-500">
                    {group.description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-2">
              {groupFields.map((field) => renderField(field, true))}
            </div>
          </section>
        );
      })}

      {ungroupedFields.length > 0 ? (
        <div className="grid gap-5">
          {ungroupedFields.map((field) => renderField(field))}
        </div>
      ) : null}
    </div>
  );
}
