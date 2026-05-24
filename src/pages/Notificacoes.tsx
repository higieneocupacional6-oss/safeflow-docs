import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Check, Loader2, Trash2, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { gerarNotificacoes } from "@/lib/notificacoes";

const tipoConfig: Record<string, { label: string; icon: any; cls: string }> = {
  "30_dias": { label: "30 dias para vencer", icon: Clock, cls: "bg-blue-100 text-blue-700 border-blue-300" },
  "15_dias": { label: "15 dias para vencer", icon: AlertTriangle, cls: "bg-amber-100 text-amber-700 border-amber-300" },
  "vencimento": { label: "Vencido", icon: AlertCircle, cls: "bg-red-100 text-red-700 border-red-300" },
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

export default function Notificacoes() {
  const qc = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroLida, setFiltroLida] = useState<string>("nao_lidas");
  const [search, setSearch] = useState("");

  useEffect(() => { gerarNotificacoes().catch(() => {}); }, []);

  useRealtimeSync([{ table: "notificacoes", queryKey: ["notificacoes"] }], "notificacoes-sync");

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data } = await supabase.from("notificacoes").select("*").order("data_vencimento", { ascending: true });
      return data || [];
    },
  });

  const filtradas = useMemo(() => (notifs as any[]).filter((n) => {
    if (filtroTipo !== "all" && n.tipo !== filtroTipo) return false;
    if (filtroLida === "nao_lidas" && n.lida) return false;
    if (filtroLida === "lidas" && !n.lida) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(n.empresa_nome || "").toLowerCase().includes(q) &&
        !(n.documento_nome || "").toLowerCase().includes(q) &&
        !(n.contrato_numero || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }), [notifs, filtroTipo, filtroLida, search]);

  const markRead = async (id: string, lida: boolean) => {
    await supabase.from("notificacoes").update({ lida }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notificacoes"] });
  };
  const markAllRead = async () => {
    await supabase.from("notificacoes").update({ lida: true }).eq("lida", false);
    qc.invalidateQueries({ queryKey: ["notificacoes"] });
    toast.success("Todas marcadas como lidas");
  };
  const remove = async (id: string) => {
    await supabase.from("notificacoes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notificacoes"] });
  };

  const naoLidas = (notifs as any[]).filter((n) => !n.lida).length;

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Monitoramento automático de vencimentos de documentos"
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={!naoLidas}>
            <Check className="w-4 h-4 mr-2" /> Marcar todas como lidas
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-700" /></div>
          <div>
            <p className="text-xs text-muted-foreground">30 dias</p>
            <p className="text-xl font-bold">{(notifs as any[]).filter((n) => n.tipo === "30_dias" && !n.lida).length}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-700" /></div>
          <div>
            <p className="text-xs text-muted-foreground">15 dias</p>
            <p className="text-xl font-bold">{(notifs as any[]).filter((n) => n.tipo === "15_dias" && !n.lida).length}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-700" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Vencidos</p>
            <p className="text-xl font-bold">{(notifs as any[]).filter((n) => n.tipo === "vencimento" && !n.lida).length}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input placeholder="Buscar empresa, contrato, documento..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="30_dias">30 dias</SelectItem>
            <SelectItem value="15_dias">15 dias</SelectItem>
            <SelectItem value="vencimento">Vencidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroLida} onValueChange={setFiltroLida}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nao_lidas">Não lidas</SelectItem>
            <SelectItem value="lidas">Lidas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtradas.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((n: any) => {
                const cfg = tipoConfig[n.tipo];
                const Icon = cfg?.icon || BellRing;
                return (
                  <TableRow key={n.id} className={n.lida ? "opacity-60" : ""}>
                    <TableCell>
                      <Badge className={`${cfg?.cls} gap-1`}>
                        <Icon className="w-3 h-3" /> {cfg?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{n.empresa_nome || "—"}</TableCell>
                    <TableCell className="text-sm">{n.contrato_numero || "—"}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className="font-mono text-[10px] mr-2">{n.documento_tipo}</Badge>
                      {n.documento_nome}
                    </TableCell>
                    <TableCell className="text-sm">{fmt(n.data_vencimento)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead(n.id, !n.lida)} title={n.lida ? "Marcar como não lida" : "Marcar como lida"}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(n.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
