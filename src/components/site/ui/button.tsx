import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Shared = { variant?: "primary" | "ghost"; className?: string; children: ReactNode };
type LinkButtonProps = Shared & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type NativeButtonProps = Shared & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
const classes = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export function Button(props: LinkButtonProps | NativeButtonProps) {
  const variant = props.variant ?? "primary";
  const className = `${classes} ${variant === "primary" ? "bg-bone text-ink hover:bg-white" : "border border-bone/35 bg-transparent text-bone hover:border-gold hover:text-gold"} ${props.className ?? ""}`;
  if ("href" in props && props.href) {
    const link = props as LinkButtonProps;
    return <Link href={link.href} className={className} onClick={link.onClick} target={link.target} rel={link.rel} aria-label={link["aria-label"]}>{link.children}</Link>;
  }
  const button = props as NativeButtonProps;
  return <button type={button.type ?? "button"} disabled={button.disabled} onClick={button.onClick} aria-label={button["aria-label"]} aria-pressed={button["aria-pressed"]} className={className}>{button.children}</button>;
}