import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AepAetIdentificacao } from "@/lib/aepAetFormulario";

type Props = {
  value: AepAetIdentificacao;
  onChange: (next: AepAetIdentificacao) => void;
  empresaNome: string;
  contratoNome: string;
  errors?: Partial<Record<keyof AepAetIdentificacao, boolean>>;
};

export function AepAetEtapaIdentificacao({
  value,
  onChange,
  empresaNome,
  contratoNome,
  errors,
}: Props) {
  const set = <K extends keyof AepAetIdentificacao>(campo: K, v: AepAetIdentificacao[K]) =>
    onChange({ ...value, [campo]: v });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Identificação</h2>
        <p className="text-sm text-muted-foreground">
          Dados da avaliação. Empresa e contrato vêm da seleção anterior.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Empresa</p>
          <p className="font-medium">{empresaNome || "—"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Contrato</p>
          <p className="font-medium">{contratoNome || "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="aep-aet-data">
            Data da avaliação <span className="text-destructive">*</span>
          </Label>
          <Input
            id="aep-aet-data"
            type="date"
            value={value.data_avaliacao}
            onChange={(e) => set("data_avaliacao", e.target.value)}
            aria-invalid={!!errors?.data_avaliacao}
            className={errors?.data_avaliacao ? "border-destructive" : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aep-aet-colab">
            Colaborador avaliado <span className="text-destructive">*</span>
          </Label>
          <Input
            id="aep-aet-colab"
            value={value.colaborador_avaliado}
            onChange={(e) => set("colaborador_avaliado", e.target.value)}
            placeholder="Nome do colaborador"
            aria-invalid={!!errors?.colaborador_avaliado}
            className={errors?.colaborador_avaliado ? "border-destructive" : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aep-aet-setor">
            Setor avaliado <span className="text-destructive">*</span>
          </Label>
          <Input
            id="aep-aet-setor"
            value={value.setor_avaliado}
            onChange={(e) => set("setor_avaliado", e.target.value)}
            aria-invalid={!!errors?.setor_avaliado}
            className={errors?.setor_avaliado ? "border-destructive" : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aep-aet-funcao">
            Função avaliada <span className="text-destructive">*</span>
          </Label>
          <Input
            id="aep-aet-funcao"
            value={value.funcao_avaliada}
            onChange={(e) => set("funcao_avaliada", e.target.value)}
            aria-invalid={!!errors?.funcao_avaliada}
            className={errors?.funcao_avaliada ? "border-destructive" : undefined}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="aep-aet-qtd">
            Quantidade de colaboradores que exercem a função{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="aep-aet-qtd"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={value.qtd_colaboradores_funcao}
            onChange={(e) => set("qtd_colaboradores_funcao", e.target.value)}
            placeholder="Ex.: 5"
            aria-invalid={!!errors?.qtd_colaboradores_funcao}
            className={errors?.qtd_colaboradores_funcao ? "border-destructive sm:max-w-xs" : "sm:max-w-xs"}
          />
        </div>
      </div>
    </section>
  );
}
