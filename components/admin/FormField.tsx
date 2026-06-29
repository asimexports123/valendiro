interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "number" | "url" | "textarea" | "select";
  defaultValue?: string | number | null;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  defaultValue = "",
  options,
  required,
  placeholder,
  rows = 4,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      )}
    </div>
  );
}
