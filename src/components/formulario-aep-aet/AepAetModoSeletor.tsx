import { Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AepAetModo } from "@/lib/aepAetOfflineDb";

type Props = {
  modo: AepAetModo;
  onChange: (modo: AepAetModo) => void;
  disabled?: boolean;
};

export function AepAetModoSeletor({ modo, onChange, disabled }: Props) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-border/80 bg-muted/30 p-0.5"
      role="group"
      aria-label="Modo de preenchimento"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("online")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          modo === "online"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={modo === "online"}
      >
        <Cloud className="h-3.5 w-3.5" />
        Online
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("offline")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          modo === "offline"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={modo === "offline"}
      >
        <CloudOff className="h-3.5 w-3.5" />
        Offline
      </button>
    </div>
  );
}
