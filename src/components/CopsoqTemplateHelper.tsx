import { useState } from "react";
import { Brain, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import jsPDF from "jspdf";

const BLOCOS: { titulo: string; perguntas: string[] }[] = [
  {
    titulo: "1. EXIGÊNCIAS DO TRABALHO",
    perguntas: [
      "Seu trabalho exige que você trabalhe muito rápido?",
      "Seu trabalho exige prazos muito curtos?",
      "Você tem muitas tarefas ao mesmo tempo?",
      "Seu trabalho exige muito esforço mental?",
    ],
  },
  {
    titulo: "2. CONTROLE E AUTONOMIA",
    perguntas: [
      "Você pode decidir como realizar seu trabalho?",
      "Você tem influência sobre seu ritmo de trabalho?",
      "Você pode fazer pausas quando necessário?",
    ],
  },
  {
    titulo: "3. APOIO SOCIAL",
    perguntas: [
      "Você recebe ajuda dos colegas quando precisa?",
      "Seu superior apoia você no trabalho?",
      "Existe boa comunicação na equipe?",
    ],
  },
  {
    titulo: "4. RECONHECIMENTO E RECOMPENSA",
    perguntas: [
      "Seu trabalho é valorizado?",
      "Você se sente reconhecido pelo que faz?",
    ],
  },
  {
    titulo: "5. SEGURANÇA NO TRABALHO",
    perguntas: [
      "Você se sente seguro quanto à manutenção do seu emprego?",
      "Há mudanças frequentes que geram insegurança?",
    ],
  },
  {
    titulo: "6. CONFLITOS E ASSÉDIO",
    perguntas: [
      "Você presencia conflitos frequentes no trabalho?",
      "Já se sentiu desrespeitado no ambiente de trabalho?",
    ],
  },
  {
    titulo: "7. SINTOMAS RELACIONADOS AO TRABALHO",
    perguntas: [
      "Você se sente estressado devido ao trabalho?",
      "Você sente cansaço excessivo ao final do dia?",
      "Tem dificuldade para desligar do trabalho?",
      "Já teve problemas de sono por causa do trabalho?",
    ],
  },
];

const OPCOES = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];

export function CopsoqTemplateHelper() {
  const [open, setOpen] = useState(false);
  const [colaborador, setColaborador] = useState("");
  const [funcao, setFuncao] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  const formatarData = (iso: string) => {
    if (!iso) return "____/____/______";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const gerarPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 15;
    let y = 15;

    const checkPage = (needed: number) => {
      if (y + needed > pageH - 15) {
        doc.addPage();
        y = 15;
      }
    };

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("AVALIAÇÃO PSICOSSOCIAL – COPSOQ", pageW / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Questionário para aplicação manual (NR-01)", pageW / 2, y, { align: "center" });
    y += 8;

    // Linha
    doc.setDrawColor(120);
    doc.line(marginX, y, pageW - marginX, y);
    y += 6;

    // Cabeçalho identificação
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Colaborador:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(colaborador || "_______________________________________________", marginX + 28, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Função:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(funcao || "_______________________________________________", marginX + 28, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Data:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatarData(data), marginX + 28, y);
    y += 8;

    // Escala
    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, y, pageW - marginX * 2, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ESCALA DE RESPOSTAS:", marginX + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Nunca (0)   |   Raramente (25)   |   Às vezes (50)   |   Frequentemente (75)   |   Sempre (100)", marginX + 2, y + 11);
    y += 20;

    // Blocos
    BLOCOS.forEach((bloco) => {
      checkPage(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setFillColor(230, 230, 230);
      doc.rect(marginX, y - 4, pageW - marginX * 2, 7, "F");
      doc.text(bloco.titulo, marginX + 2, y + 1);
      y += 8;

      doc.setFontSize(9);
      bloco.perguntas.forEach((p, idx) => {
        const linhas = doc.splitTextToSize(`${idx + 1}. ${p}`, pageW - marginX * 2 - 4);
        const altura = linhas.length * 4 + 8;
        checkPage(altura);

        doc.setFont("helvetica", "normal");
        doc.text(linhas, marginX + 2, y);
        y += linhas.length * 4 + 2;

        // Opções com círculos
        let x = marginX + 4;
        OPCOES.forEach((op) => {
          doc.circle(x, y - 1, 1.4);
          doc.text(op, x + 3, y);
          x += doc.getTextWidth(op) + 12;
        });
        y += 6;
      });
      y += 3;
    });

    // Assinatura
    checkPage(25);
    y += 6;
    doc.setDrawColor(0);
    doc.line(marginX, y, marginX + 80, y);
    doc.line(pageW - marginX - 80, y, pageW - marginX, y);
    y += 4;
    doc.setFontSize(8);
    doc.text("Assinatura do Colaborador", marginX + 15, y);
    doc.text("Assinatura do Responsável Técnico", pageW - marginX - 70, y);

    // Rodapé numeração
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Página ${i} de ${total}  •  COPSOQ – SAFEDOC`, pageW / 2, pageH - 8, { align: "center" });
    }

    const nome = (colaborador || "colaborador").replace(/[^a-zA-Z0-9]+/g, "_");
    doc.save(`COPSOQ_${nome}_${data}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Brain className="w-4 h-4" />
        COPSOQ
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" />
              Avaliação Psicossocial – COPSOQ (Impressão)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Preencha os dados do colaborador. O PDF gerado contém o questionário completo para aplicação manual.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Nome do Colaborador</Label>
                <Input
                  className="mt-1"
                  placeholder="Ex: João da Silva"
                  value={colaborador}
                  onChange={(e) => setColaborador(e.target.value)}
                />
              </div>
              <div>
                <Label>Função</Label>
                <Input
                  className="mt-1"
                  placeholder="Ex: Operador de Produção"
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                />
              </div>
              <div>
                <Label>Data da Avaliação</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pré-visualização do conteúdo
              </div>
              <div className="text-xs bg-card rounded p-3 border">
                <strong>Escala:</strong> Nunca (0) • Raramente (25) • Às vezes (50) • Frequentemente (75) • Sempre (100)
              </div>
              <ul className="text-xs space-y-1 text-foreground/80">
                {BLOCOS.map((b) => (
                  <li key={b.titulo}>
                    • <strong>{b.titulo}</strong>{" "}
                    <span className="text-muted-foreground">({b.perguntas.length} perguntas)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={gerarPDF}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
