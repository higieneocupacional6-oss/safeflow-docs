import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AepAetSimNao } from "@/components/formulario-aep-aet/AepAetSimNao";
import type { AepAetOrganizacaoTrabalho, SimNao } from "@/lib/aepAetFormulario";

type Props = {
  value: AepAetOrganizacaoTrabalho;
  onChange: (next: AepAetOrganizacaoTrabalho) => void;
  errors?: Partial<Record<keyof AepAetOrganizacaoTrabalho, boolean>>;
};

const PERGUNTAS: { key: keyof Omit<AepAetOrganizacaoTrabalho, "observacoes">; label: string; id: string }[] = [
  { key: "meta_producao", label: "Existe meta de produção?", id: "org-meta" },
  { key: "ritmo_maquina", label: "Existem atividades com ritmo imposto por máquina?", id: "org-ritmo" },
  { key: "rodizio_tarefas", label: "Existe rodízio de tarefas?", id: "org-tarefas" },
  { key: "rodizio_colaboradores", label: "Existe rodízio de colaboradores?", id: "org-colab" },
  { key: "pausas_atividade", label: "Existem pausas durante a atividade?", id: "org-pausas" },
];

export function AepAetEtapaOrganizacao({ value, onChange, errors }: Props) {
  const set = (key: keyof Omit<AepAetOrganizacaoTrabalho, "observacoes">, v: SimNao) =>
    onChange({ ...value, [key]: v });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Organização do trabalho</h2>
        <p className="text-sm text-muted-foreground">
          Checklist sobre metas, ritmo, rodízios e pausas.
        </p>
      </div>

      <div className="space-y-3">
        {PERGUNTAS.map((p) => (
          <AepAetSimNao
            key={p.key}
            id={p.id}
            label={p.label}
            value={value[p.key]}
            onChange={(v) => set(p.key, v)}
            required
            error={!!errors?.[p.key]}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-obs">Observações</Label>
        <Textarea
          id="org-obs"
          rows={4}
          value={value.observacoes}
          onChange={(e) => onChange({ ...value, observacoes: e.target.value })}
          placeholder="Observações sobre a organização do trabalho"
        />
      </div>
    </section>
  );
}
