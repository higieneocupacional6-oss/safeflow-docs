import { Plus, FileUp, FileText, LayoutTemplate } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockTemplates = [
  { id: "1", nome: "LTCAT Padrão v2", tipo: "LTCAT", variaveis: 12, atualizado: "10/03/2025" },
  { id: "2", nome: "PGR Construção Civil", tipo: "PGR", variaveis: 18, atualizado: "05/02/2025" },
  { id: "3", nome: "Laudo Insalubridade", tipo: "Insalubridade", variaveis: 15, atualizado: "22/01/2025" },
];

const tipoColors: Record<string, string> = {
  LTCAT: "bg-blue-100 text-blue-700 border-blue-200",
  PGR: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Insalubridade: "bg-amber-100 text-amber-700 border-amber-200",
  Periculosidade: "bg-red-100 text-red-700 border-red-200",
  PCMSO: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Templates() {
  return (
    <div>
      <PageHeader
        title="Templates"
        description="Gerencie templates de documentos com variáveis dinâmicas"
        actions={
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Novo Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map((t) => (
          <div key={t.id} className="glass-card rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <Badge className={tipoColors[t.tipo] || ""}>{t.tipo}</Badge>
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-1">{t.nome}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{t.variaveis} variáveis</span>
              <span>•</span>
              <span>Atualizado {t.atualizado}</span>
            </div>
          </div>
        ))}

        <button className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors min-h-[140px]">
          <FileUp className="w-6 h-6" />
          <span className="text-sm font-medium">Upload .docx</span>
        </button>
      </div>

      <div className="glass-card rounded-xl p-5 mt-8">
        <h3 className="font-heading font-semibold mb-3">Variáveis Disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          {["{{empresa}}", "{{cnpj}}", "{{endereco}}", "{{cnae}}", "{{setor}}", "{{funcao}}", "{{agente}}", "{{resultado}}", "{{unidade}}", "{{limite_tolerancia}}", "{{tecnica}}", "{{equipamento}}"].map((v) => (
            <Badge key={v} variant="outline" className="font-mono text-xs py-1">{v}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
