"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/site/intl-pricing";
import { useIntlStore } from "../intl-provider";

type Props = { value: number; className?: string; hideInternational?: boolean };
export function Price({ value, className = "", hideInternational = false }: Props) {
  const { enabled, country, quote, money } = useIntlStore();
  const [result, setResult] = useState<{ key: string; amount: number | null } | null>(null);
  const key = `${country.currency}:${value}`;
  useEffect(() => {
    let active = true;
    if (!enabled || country.code === "PK") return;
    quote(value).then((amount) => { if (active) setResult({ key, amount }); });
    return () => { active = false; };
  }, [enabled, country.code, quote, key, value]);
  const converted = result?.key === key ? result.amount : null;
  if (hideInternational && enabled && country.code !== "PK") return null;
  const text = enabled && country.code !== "PK" ? converted === null ? "Price confirmed on WhatsApp" : money(converted) : formatMoney(value, "PKR");
  return <span className={className}>{text}</span>;
}
