"use client";

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`relative inline-flex min-h-11 min-w-16 items-center rounded-full px-1 transition-colors ${checked ? "bg-blue-700" : "bg-slate-300"}`}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span className={`h-8 w-8 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}