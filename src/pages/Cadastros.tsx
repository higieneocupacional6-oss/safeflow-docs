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

const mockTecnicas = [
  { id: "1", nome: "Dosimetria de Ruído", descricao: "NHO-01" },
  { id: "2", nome: "Gravimetria", descricao: "NIOSH 0600" },
];

const mockEquipamentos = [
  { id: "1", nome: "Dosímetro DOS-500", marca: "Instrutherm", certificado: "RBC 2024" },
  { id: "2", nome: "Bomba Gravimétrica", marca: "SKC", certificado: "Cal. 2024" },
];

const mockUnidades = [
  { id: "1", simbolo: "dB(A)", nome: "Decibéis ponderados em A" },
  { id: "2", simbolo: "mg/m³", nome: "Miligrama por metro cúbico" },
  { id: "3", simbolo: "ppm", nome: "Partes por milhão" },
  { id: "4", simbolo: "m/s²", nome: "Metro por segundo ao quadrado" },
  { id: "5", simbolo: "°C", nome: "Graus Celsius (IBUTG)" },
];

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
                {mockTecnicas.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{t.descricao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="equipamentos" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Equipamento</TableHead><TableHead>Marca</TableHead><TableHead>Certificado</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockEquipamentos.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.marca}</TableCell>
                    <TableCell><Badge variant="secondary">{e.certificado}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="unidades" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Símbolo</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockUnidades.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell><Badge variant="outline" className="font-mono">{u.simbolo}</Badge></TableCell>
                    <TableCell>{u.nome}</TableCell>
                  </TableRow>
                ))}
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
