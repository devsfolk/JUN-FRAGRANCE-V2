import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-800" htmlFor={inputId}>
      <span>{label}</span>
      <input
        className={`min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 ${className}`}
        id={inputId}
        {...props}
      />
      {error ? <span className="text-sm font-normal text-red-700">{error}</span> : null}
    </label>
  );
}