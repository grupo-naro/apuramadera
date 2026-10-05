/**
 * Precio — muestra un monto y, si hay descuento, el precio anterior
 * tachado. Consume sólo tokens del design system: lo que se vea
 * cambia con el theme (Fase 4), no con este componente.
 */
import { formatPrice, type MoneyFormatOptions } from "@/core/lib/format";
import { cn } from "@/core/lib/utils";

type PriceSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<PriceSize, { current: string; compare: string }> = {
  sm: { current: "text-sm font-medium", compare: "text-xs" },
  md: { current: "text-base font-semibold", compare: "text-sm" },
  lg: { current: "text-2xl font-bold", compare: "text-base" },
};

interface PriceProps {
  /** Monto en centavos. */
  amount: number;
  /** Precio anterior en centavos — se tacha si es mayor al actual. */
  compareAt?: number | null;
  size?: PriceSize;
  className?: string;
  currencyOptions?: MoneyFormatOptions;
}

export function Price({
  amount,
  compareAt,
  size = "md",
  className,
  currencyOptions,
}: PriceProps) {
  const hasDiscount = compareAt != null && compareAt > amount;
  const styles = SIZE_STYLES[size];

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn(styles.current, "tabular-nums text-foreground")}>
        {formatPrice(amount, currencyOptions)}
      </span>
      {hasDiscount && (
        <s className={cn(styles.compare, "tabular-nums text-muted-foreground")}>
          {formatPrice(compareAt, currencyOptions)}
        </s>
      )}
    </span>
  );
}
