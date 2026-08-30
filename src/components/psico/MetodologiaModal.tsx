import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

export type MetodologiaInfo = {
  periodo: string;
  participacao: string;
  observacao: string;
};

export function MetodologiaModal({
  open, onOpenChange, valor, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  valor: MetodologiaInfo;
  onConfirm: (v: MetodologiaInfo) => void;
}) {
  const [form, setForm] = useState<MetodologiaInfo>(valor);
  useEffect(() => { if (open) setForm(valor); }, [open, valor]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Informações da metodologia</DialogTitle>
          <DialogDescription>
            Estas informações não estão disponíveis no sistema e são necessárias para compor o
            texto técnico da metodologia. O texto será reformulado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Período da coleta</Label>
            <Input
              value={form.periodo}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
              placeholder="Ex.: 05/08/2026 a 20/08/2026"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Observação das atividades</Label>
            <Textarea
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder="Ex.: observação direta das atividades nos postos de trabalho em 12/08/2026"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Participação dos trabalhadores</Label>
            <Textarea
              value={form.participacao}
              onChange={(e) => setForm({ ...form, participacao: e.target.value })}
              placeholder="Ex.: participação voluntária dos trabalhadores das funções avaliadas, com apoio da CIPA"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Depois</Button>
          <Button onClick={() => { onConfirm(form); onOpenChange(false); }}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
