import { useState } from "react";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const docTypes = [
  { id: "ltcat", label: "LTCAT", desc: "Laudo Técnico das Condições Ambientais de Trabalho" },
  { id: "pgr", label: "PGR", desc: "Programa de Gerenciamento de Riscos" },
  { id: "pcmso", label: "PCMSO", desc: "Programa de Controle Médico de Saúde Ocupacional" },
  { id: "insalubridade", label: "Insalubridade", desc: "Laudo de Insalubridade" },
  { id: "periculosidade", label: "Periculosidade", desc: "Laudo de Periculosidade" },
];

const mockDocs = [
  { id: "1", tipo: "LTCAT", empresa: "Alpha Construções", data: "10/04/2025", status: "concluido" },
  { id: "2", tipo: "PGR", empresa: "Beta Industrial", data: "08/04/2025", status: "rascunho" },
  { id: "3", tipo: "LTCAT", empresa: "Beta Industrial", data: "01/04/2025", status: "concluido" },
];

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  concluido: { label: "Concluído", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  rascunho: { label: "Rascunho", icon: Clock, className: "bg-amber-100 text-amber-700" },
  erro: { label: "Erro", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

export default function Documentos() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectType = (typeId: string) => {
    setOpen(false);
    if (typeId === "ltcat") {
      navigate("/documentos/ltcat/novo");
    }
  };

  return (
    <div>
      <PageHeader
        title="Documentos SST"
        description="Crie e gerencie documentos técnicos de segurança do trabalho"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Novo Documento
          </Button>
        }
      />

      <div className="space-y-3">
        {mockDocs.map((doc) => {
          const st = statusConfig[doc.status];
          return (
            <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{doc.tipo}</Badge>
                  <span className="font-medium text-foreground">{doc.empresa}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.data}</p>
              </div>
              <Badge className={`${st.className} gap-1`}>
                <st.icon className="w-3 h-3" />
                {st.label}
              </Badge>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {docTypes.map((dt) => (
              <button
                key={dt.id}
                onClick={() => handleSelectType(dt.id)}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors"
              >
                <span className="font-heading font-semibold text-foreground">{dt.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{dt.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
