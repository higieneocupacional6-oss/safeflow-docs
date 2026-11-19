import { cn } from "@/lib/utils";
import logoMark from "@/assets/segdoc-logo.png";

type BrandLogoProps = {
  /** Só o emblema. */
  markOnly?: boolean;
  /** Texto ao lado do emblema. */
  showWordmark?: boolean;
  /** Contraste do wordmark. */
  tone?: "auto" | "light" | "dark";
  /** Escala visual. */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  markClassName?: string;
  priority?: boolean;
};

const MARK_SIZE = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
} as const;

const TITLE_SIZE = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-2xl",
} as const;

/**
 * Logomarca oficial SegDoc — escudo + documento + verificação.
 * Proporção preservada (object-contain); legível em tema claro e escuro.
 */
export function BrandLogo({
  markOnly = false,
  showWordmark = !markOnly,
  tone = "auto",
  size = "md",
  className,
  markClassName,
  priority = false,
}: BrandLogoProps) {
  const wordTone =
    tone === "light"
      ? "text-white"
      : tone === "dark"
        ? "text-foreground"
        : "text-foreground dark:text-white";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={logoMark}
        alt={showWordmark ? "" : "SegDoc"}
        width={128}
        height={128}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        className={cn("object-contain shrink-0 select-none", MARK_SIZE[size], markClassName)}
        draggable={false}
      />
      {showWordmark && (
        <span className={cn("leading-tight", wordTone)}>
          <span className={cn("font-heading font-bold tracking-tight block", TITLE_SIZE[size])}>
            SEG<span className="opacity-80">DOC</span>
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] opacity-60">
            Gestão SST
          </span>
        </span>
      )}
    </span>
  );
}
