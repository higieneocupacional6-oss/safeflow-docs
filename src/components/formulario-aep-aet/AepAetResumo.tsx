import type { ReactNode } from "react";
import { AEP_AET_ETAPAS, rotuloSimNao, type AepAetDados } from "@/lib/aepAetFormulario";
import { formatDateOnly } from "@/lib/dateOnly";

type Props = {
  dados: AepAetDados;
  empresaNome: string;
  contratoNome: string;
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h4>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function AepAetResumo({ dados, empresaNome, contratoNome }: Props) {
  const id = dados.identificacao;
  const va = dados.variabilidade;
  const org = dados.organizacao_trabalho;
  const saude = dados.dados_saude;
  const sug = dados.sugestoes_melhoria;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-4">
      <div>
        <h3 className="font-heading text-sm font-semibold">Resumo da avaliação</h3>
        <p className="text-xs text-muted-foreground">
          Visão geral do preenchimento ({AEP_AET_ETAPAS.length} etapas). Todos os dados permanecem editáveis.
        </p>
      </div>

      <Bloco titulo="Identificação">
        <Item label="Empresa" value={empresaNome} />
        <Item label="Contrato" value={contratoNome} />
        <Item label="Data" value={formatDateOnly(id.data_avaliacao)} />
        <Item label="Colaborador" value={id.colaborador_avaliado} />
        <Item label="Setor" value={id.setor_avaliado} />
        <Item label="Função" value={id.funcao_avaliada} />
        <Item label="Qtd. colaboradores" value={id.qtd_colaboradores_funcao} />
      </Bloco>

      <Bloco titulo="Variabilidade">
        <Item label="Atividade sempre igual" value={rotuloSimNao(va.atividade_sempre_igual)} />
        <Item label="Atividades diferentes no dia" value={rotuloSimNao(va.atividades_diferentes_dia)} />
        <Item label="Rodízio de atividades" value={rotuloSimNao(va.rodizio_atividades)} />
        <Item label="Horas extras" value={rotuloSimNao(va.realiza_horas_extras)} />
        {va.realiza_horas_extras === "sim" && (
          <Item label="Frequência HE" value={va.frequencia_horas_extras} />
        )}
      </Bloco>

      <Bloco titulo="Posturas / movimentos / esforço">
        <Item label="Posturas" value={dados.posturas.posturas.join(", ")} />
        <Item label="Fotos posturas" value={String(dados.posturas.fotos.length)} />
        <Item
          label="Movimentos repetitivos"
          value={rotuloSimNao(dados.movimentos_repetitivos.existem_movimentos_repetitivos)}
        />
        <Item
          label="Esforço físico"
          value={
            dados.esforco_fisico.sem_esforco
              ? "Sem esforço"
              : dados.esforco_fisico.opcoes.join(", ") || "—"
          }
        />
      </Bloco>

      <Bloco titulo="Mobiliário e ambiente">
        <Item
          label="Mobiliário"
          value={
            dados.mobiliario_equipamentos.sem_mobiliario
              ? "Sem mobiliário"
              : `Mesa ${dados.mobiliario_equipamentos.mesa.altura_cm || "—"} × ${dados.mobiliario_equipamentos.mesa.comprimento_cm || "—"} × ${dados.mobiliario_equipamentos.mesa.largura_cm || "—"} cm`
          }
        />
        <Item
          label="Ferramentas/mobiliário"
          value={
            dados.ferramentas_mobiliario.sugestoes.join(", ") ||
            dados.ferramentas_mobiliario.descricao ||
            "—"
          }
        />
        <Item label="Iluminação" value={`${dados.condicoes_ambientais.iluminacao_lux || "—"} lux`} />
        <Item label="Ruído" value={`${dados.condicoes_ambientais.ruido_dba || "—"} dB(A)`} />
        <Item label="Temperatura" value={`${dados.condicoes_ambientais.temperatura_c || "—"} °C`} />
        <Item
          label="Vibração"
          value={
            dados.condicoes_ambientais.vibracao_exposicao === "sim"
              ? `${dados.condicoes_ambientais.vibracao_valor} ${dados.condicoes_ambientais.vibracao_unidade}`.trim()
              : rotuloSimNao(dados.condicoes_ambientais.vibracao_exposicao)
          }
        />
      </Bloco>

      <Bloco titulo="Organização e cronoanálise">
        <Item label="Meta de produção" value={rotuloSimNao(org.meta_producao)} />
        <Item label="Ritmo de máquina" value={rotuloSimNao(org.ritmo_maquina)} />
        <Item label="Rodízio de tarefas" value={rotuloSimNao(org.rodizio_tarefas)} />
        <Item label="Rodízio de colaboradores" value={rotuloSimNao(org.rodizio_colaboradores)} />
        <Item label="Pausas" value={rotuloSimNao(org.pausas_atividade)} />
        <Item
          label="Linhas de cronoanálise"
          value={String(dados.cronoanalise.linhas.filter((l) => l.tarefa.trim()).length)}
        />
      </Bloco>

      <Bloco titulo="Saúde e sugestões">
        <Item label="Desconforto físico" value={rotuloSimNao(saude.sente_desconforto)} />
        {saude.sente_desconforto === "sim" && (
          <Item label="Locais" value={saude.locais.join(", ")} />
        )}
        <Item label="Sugestões" value={sug.sugestoes} />
        <Item label="Observações finais" value={sug.observacoes} />
        <Item label="Fotos complementares" value={String(sug.fotos.length)} />
      </Bloco>
    </div>
  );
}
