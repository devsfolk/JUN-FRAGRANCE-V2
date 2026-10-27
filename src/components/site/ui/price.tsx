type Props = { value: number; className?: string };
export function Price({ value, className = "" }: Props) {
  return <span className={className}>Rs. {new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}</span>;
}