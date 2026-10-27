import type { SelectHTMLAttributes } from "react";

type SelectOption = { label: string; value: string };
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
};

export function Select({ label, options, className = "", id, ...props }: SelectProps) {
  const inputId = id ?? props.name;
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-800" htmlFor={inputId}>
      <span>{label}</span>
      <select
        className={`min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 ${className}`}
        id={inputId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}