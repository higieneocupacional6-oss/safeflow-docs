import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { baixarRelatorioAmostradores } from "@/lib/fichaTecnicaPdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function AmostradoresDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState("");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["ficha-tecnica-amostradores"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("ficha_tecnica_resultados")
        .select("id, data_avaliacao, amostrador, amostrador_serie, empresa_id, contrato_id, agente_id")
        .not("amostrador", "is", null).order("data_avaliacao", { ascending: false });
      if (error) throw error;
      const source = data || [];
      const empresaIds = [...new Set(source.map((row) => row.empresa_id))];
      const contratoIds = [...new Set(source.map((row) => row.contrato_id))];
      const agenteIds = [...new Set(source.map((row) => row.agente_id))];
      const [empresas, contratos, agentes] = await Promise.all([
        empresaIds.length ? supabase.from("empresas").select("id, razao_social, nome_fantasia").in("id", empresaIds) : Promise.resolve({ data: [], error: null }),
        contratoIds.length ? supabase.from("contratos").select("id, numero_contrato, nome_contratante").in("id", contratoIds) : Promise.resolve({ data: [], error: null }),
        agenteIds.length ? supabase.from("riscos").select("id, nome").in("id", agenteIds) : Promise.resolve({ data: [], error: null }),
      ]);
      const lookup = (items: any[] | null, id: string) => items?.find((item) => item.id === id);
      return source.map((row) => ({ ...row,
        empresa_nome: lookup(empresas.data, row.empresa_id)?.nome_fantasia || lookup(empresas.data, row.empresa_id)?.razao_social,
        contrato_nome: lookup(contratos.data, row.contrato_id)?.numero_contrato || lookup(contratos.data, row.contrato_id)?.nome_contratante,
        agente_nome: lookup(agentes.data, row.agente_id)?.nome,
      }));
    },
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return rows;
    return rows.filter((row) => `${row.amostrador} ${row.amostrador_serie || ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [rows, search]);
  const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader><DialogTitle>Amostradores usados</DialogTitle></DialogHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por amostrador ou número de série" /></div>
        <Button variant="outline" onClick={() => baixarRelatorioAmostradores(filtered)} disabled={!filtered.length}><Download className="mr-2 h-4 w-4" />Baixar relatório</Button>
      </div>
      <div className="overflow-auto border rounded-md">
        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : !filtered.length ? <p className="py-16 text-center text-muted-foreground">Nenhum amostrador encontrado.</p> : <Table><TableHeader><TableRow><TableHead>Amostrador</TableHead><TableHead>Nº/série</TableHead><TableHead>Empresa</TableHead><TableHead>Data</TableHead><TableHead>Contrato</TableHead><TableHead>Agente</TableHead></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.amostrador}</TableCell><TableCell>{row.amostrador_serie || "—"}</TableCell><TableCell>{row.empresa_nome || "—"}</TableCell><TableCell>{date(row.data_avaliacao)}</TableCell><TableCell>{row.contrato_nome || "—"}</TableCell><TableCell>{row.agente_nome || "—"}</TableCell></TableRow>)}</TableBody></Table>}
      </div>
    </DialogContent>
  </Dialog>;
}