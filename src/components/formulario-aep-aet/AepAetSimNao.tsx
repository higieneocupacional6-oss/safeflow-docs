import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SimNao } from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  value: SimNao;
  onChange: (v: SimNao) => void;
  required?: boolean;
  error?: boolean;
};

export function AepAetSimNao({ id, label, value, onChange, required, error }: Props) {
  return (
    <div className={cn("space-y-2 rounded-lg border p-3", error ? "border-destructive/60" : "border-border/70")}>
      <Label htmlFor={`${id}-sim`} className="text-sm font-medium leading-snug">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <RadioGroup
        value={value || undefined}
        onValueChange={(v) => onChange(v === "sim" || v === "nao" ? v : "")}
        className="flex flex-wrap gap-4"
        aria-required={required}
      >
        <label htmlFor={`${id}-sim`} className="flex cursor-pointer items-center gap-2 text-sm">
          <RadioGroupItem value="sim" id={`${id}-sim`} />
          Sim
        </label>
        <label htmlFor={`${id}-nao`} className="flex cursor-pointer items-center gap-2 text-sm">
          <RadioGroupItem value="nao" id={`${id}-nao`} />
          Não
        </label>
      </RadioGroup>
    </div>
  );
}
