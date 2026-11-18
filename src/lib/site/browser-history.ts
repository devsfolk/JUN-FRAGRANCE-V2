"use client";

import { useCallback, useEffect, useRef } from "react";

const OVERLAY_STATE_KEY = "__jfDismissOverlay";

export function useBackDismissOverlay(open: boolean, onDismiss: () => void, id: string) {
  const dismissRef = useRef(onDismiss);
  const ownsHistoryEntry = useRef(false);
  useEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ ...(window.history.state ?? {}), [OVERLAY_STATE_KEY]: id }, "", window.location.href);
    ownsHistoryEntry.current = true;
    const onPopState = () => {
      if (window.history.state?.[OVERLAY_STATE_KEY] === id) return;
      ownsHistoryEntry.current = false;
      dismissRef.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (ownsHistoryEntry.current && window.history.state?.[OVERLAY_STATE_KEY] === id) {
        ownsHistoryEntry.current = false;
        window.history.back();
      }
    };
  }, [open, id]);
}

export function useWizardBackState(step: number, setStep: (step: number) => void, key: string) {
  const latestStep = useRef(step);
  const ignoreStepEffect = useRef(false);
  useEffect(() => {
    const onPopState = () => {
      const stateStep = window.history.state?.[key];
      const target = Number.isInteger(stateStep) ? Math.max(0, stateStep as number) : 0;
      if (target === latestStep.current) return;
      latestStep.current = target;
      ignoreStepEffect.current = true;
      setStep(target);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [key, setStep]);
  useEffect(() => {
    if (ignoreStepEffect.current) {
      ignoreStepEffect.current = false;
      latestStep.current = step;
      return;
    }
    if (step === latestStep.current) return;
    window.history.pushState({ ...(window.history.state ?? {}), [key]: step }, "", window.location.href);
    latestStep.current = step;
  }, [key, step]);
  return useCallback(() => {
    if (step <= 0) return;
    if (window.history.state?.[key] === step) window.history.back();
    else setStep(step - 1);
  }, [key, setStep, step]);
}
