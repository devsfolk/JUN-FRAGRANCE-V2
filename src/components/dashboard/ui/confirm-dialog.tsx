"use client";

import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section aria-labelledby="confirm-title" aria-modal="true" className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl" role="alertdialog">
        <h2 className="text-lg font-semibold text-slate-950" id="confirm-title">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onCancel} variant="secondary">Cancel</Button>
          <Button disabled={pending} onClick={onConfirm} variant="danger">
            {pending ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}