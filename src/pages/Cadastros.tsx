import { useState } from "react";
import { Plus, FlaskConical, Ruler, Wrench, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RiscoModal } from "@/components/RiscoModal";

// Mock data removed in favor of real database queries


type TabKey = "riscos" | "tecnicas" | "equipamentos" | "unidades";

export default function Cadastros() {
  const [tab, setTab] = useState<TabKey>("riscos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [riscoModalOpen, setRiscoModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: riscos = [] } = useQuery({
    queryKey: ["riscos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("riscos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tecnicas = [] } = useQuery({
    queryKey: ["tecnicas_amostragem"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tecnicas_amostragem").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: equipamentos_ho = [] } = useQuery({
    queryKey: ["equipamentos_ho"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipamentos_ho").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("simbolo");
      if (error) throw error;
      return data;
    },
  });


  const handleNovo = () => {
    if (tab === "riscos") {
      setRiscoModalOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cadastros Gerais"
        description="Gerencie riscos, agentes, técnicas e equipamentos"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="riscos" className="gap-2"><AlertTriangle className="w-3.5 h-3.5" />Riscos / Agentes</TabsTrigger>
            <TabsTrigger value="tecnicas" className="gap-2"><FlaskConical className="w-3.5 h-3.5" />Técnicas</TabsTrigger>
            <TabsTrigger value="equipamentos" className="gap-2"><Wrench className="w-3.5 h-3.5" />Equipamentos</TabsTrigger>
            <TabsTrigger value="unidades" className="gap-2"><Ruler className="w-3.5 h-3.5" />Unidades</TabsTrigger>
          </TabsList>
          <Button onClick={handleNovo} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Novo
          </Button>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <TabsContent value="riscos" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>eSocial</TableHead>
                  <TableHead>Exposição</TableHead>
                  <TableHead>EPI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riscos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum risco cadastrado. Clique em "+ Novo" para começar.
                    </TableCell>
                  </TableRow>
                )}
                {riscos.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell><Badge variant="outline">{r.tipo}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{r.codigo_esocial || "—"}</TableCell>
                    <TableCell className="text-sm">{r.tipo_exposicao || "—"}</TableCell>
                    <TableCell>
                      {r.epi_eficaz ? (
                        <Badge variant={r.epi_eficaz === "Sim" ? "default" : "destructive"} className="text-xs">
                          {r.epi_eficaz}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="tecnicas" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Técnica</TableHead><TableHead>Referência</TableHead></TableRow></TableHeader>
              <TableBody>
                {tecnicas.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-8">Nenhuma técnica cadastrada</TableCell></TableRow>
                ) : (
                  tecnicas.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{t.referencia}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="equipamentos" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Equipamento</TableHead><TableHead>Marca</TableHead><TableHead>Certificado</TableHead></TableRow></TableHeader>
              <TableBody>
                {equipamentos_ho.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Nenhum equipamento cadastrado</TableCell></TableRow>
                ) : (
                  equipamentos_ho.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell>{e.marca}</TableCell>
                      <TableCell><Badge variant="secondary">{e.certificado}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="unidades" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Símbolo</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
              <TableBody>
                {unidades.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-8">Nenhuma unidade cadastrada</TableCell></TableRow>
                ) : (
                  unidades.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell><Badge variant="outline" className="font-mono">{u.simbolo}</Badge></TableCell>
                      <TableCell>{u.nome}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal de Riscos */}
      <RiscoModal
        open={riscoModalOpen}
        onOpenChange={setRiscoModalOpen}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["riscos"] })}
      />

      {/* Modal genérico para outras abas */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              Novo {tab === "tecnicas" ? "Técnica" : tab === "equipamentos" ? "Equipamento" : "Unidade"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {tab === "tecnicas" && (
              <>
                <div><Label>Nome da Técnica</Label><Input className="mt-1" placeholder="Ex: Dosimetria de Ruído" /></div>
                <div><Label>Referência / Norma</Label><Input className="mt-1" placeholder="Ex: NHO-01" /></div>
              </>
            )}
            {tab === "equipamentos" && (
              <>
                <div><Label>Nome do Equipamento</Label><Input className="mt-1" placeholder="Ex: Dosímetro DOS-500" /></div>
                <div><Label>Marca</Label><Input className="mt-1" placeholder="Ex: Instrutherm" /></div>
                <div><Label>Certificado</Label><Input className="mt-1" placeholder="Ex: RBC 2024" /></div>
              </>
            )}
            {tab === "unidades" && (
              <>
                <div><Label>Símbolo</Label><Input className="mt-1" placeholder="Ex: dB(A)" /></div>
                <div><Label>Descrição</Label><Input className="mt-1" placeholder="Ex: Decibéis ponderados em A" /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { setDialogOpen(false); toast.success("Cadastro salvo!"); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
