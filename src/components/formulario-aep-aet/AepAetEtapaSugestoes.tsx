import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import { AepAetMicrofoneDitado } from "@/components/formulario-aep-aet/AepAetMicrofoneDitado";
import { AepAetResumo } from "@/components/formulario-aep-aet/AepAetResumo";
import type { AepAetDados, AepAetSugestoesMelhoria } from "@/lib/aepAetFormulario";

type Props = {
  value: AepAetSugestoesMelhoria;
  onChange: (next: AepAetSugestoesMelhoria) => void;
  dadosCompletos: AepAetDados;
  empresaNome: string;
  contratoNome: string;
};

export function AepAetEtapaSugestoes({
  value,
  onChange,
  dadosCompletos,
  empresaNome,
  contratoNome,
}: Props) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold">Sugestões de melhoria</h2>
        <p className="text-sm text-muted-foreground">
          Registre sugestões dos colaboradores, observações e fotos complementares.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="sug-texto">Sugestões dos colaboradores</Label>
          <AepAetMicrofoneDitado
            value={value.sugestoes}
            onChange={(sugestoes) => onChange({ ...value, sugestoes })}
            label="Ditar sugestões"
          />
        </div>
        <Textarea
          id="sug-texto"
          rows={4}
          value={value.sugestoes}
          onChange={(e) => onChange({ ...value, sugestoes: e.target.value })}
          placeholder="Sugestões relatadas pelos colaboradores"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="sug-obs">Observações complementares</Label>
          <AepAetMicrofoneDitado
            value={value.observacoes}
            onChange={(observacoes) => onChange({ ...value, observacoes })}
            label="Ditar observações"
          />
        </div>
        <Textarea
          id="sug-obs"
          rows={3}
          value={value.observacoes}
          onChange={(e) => onChange({ ...value, observacoes: e.target.value })}
          placeholder="Observações adicionais"
        />
      </div>

      <AepAetFotosCampo
        label="Fotografias complementares"
        fotos={value.fotos}
        onChange={(fotos) => onChange({ ...value, fotos })}
        maxFotos={8}
      />

      <AepAetResumo
        dados={dadosCompletos}
        empresaNome={empresaNome}
        contratoNome={contratoNome}
      />
    </section>
  );
}
