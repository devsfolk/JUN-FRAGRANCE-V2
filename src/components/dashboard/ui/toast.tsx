"use client";

import { Button } from "./button";

type ToastProps = {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
};

export function Toast({ message, tone, onDismiss }: ToastProps) {
  return (
    <div
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`fixed bottom-4 left-4 right-4 z-[60] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg sm:left-auto ${tone === "error" ? "bg-red-800" : "bg-emerald-800"}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span>{message}</span>
      <Button aria-label="Dismiss notification" className="min-w-11 px-2 text-white hover:bg-white/10" onClick={onDismiss} variant="ghost">
        ×
      </Button>
    </div>
  );
}