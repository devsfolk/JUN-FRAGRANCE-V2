import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function Textarea({ label, hint, className = "", id, ...props }: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-800" htmlFor={inputId}>
      <span>{label}</span>
      <textarea
        className={`min-h-28 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 ${className}`}
        id={inputId}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}