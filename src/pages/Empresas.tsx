import { useState } from "react";
import { Plus, Search, Building2, Pencil, Trash2, Loader2, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmpresaModal } from "@/components/EmpresaModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function Empresas() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editEmpresa, setEditEmpresa] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const queryClient = useQueryClient();

  useRealtimeSync([{ table: "empresas", queryKey: ["empresas"] }], "empresas-list-sync");

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredEmpresas = empresas.filter(
    (e: any) =>
      (e.razao_social || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.cnpj || "").includes(search)
  );

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await supabase.from("empresas").delete().eq("id", deleteConfirm.id);
    queryClient.invalidateQueries({ queryKey: ["empresas"] });
    toast.success("Empresa removida");
    setDeleteConfirm(null);
  };

  const handleEdit = (empresa: any) => {
    setEditEmpresa(empresa);
    setOpen(true);
  };

  const handleNew = () => {
    setEditEmpresa(null);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas cadastradas no sistema"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/empresas-contratos")}>
              <FileSignature className="w-4 h-4 mr-2" />Empresas & Contratos
            </Button>
            <Button onClick={handleNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />Nova Empresa
            </Button>
          </div>
        }
      />

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Nº Contrato</TableHead>
                <TableHead className="hidden sm:table-cell">Local de Trabalho</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmpresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma empresa encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmpresas.map((empresa: any) => (
                  <TableRow key={empresa.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{empresa.nome_fantasia || empresa.razao_social}</p>
                        <p className="text-xs text-muted-foreground">{empresa.razao_social}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{empresa.cnpj}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{empresa.numero_contrato || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{empresa.local_trabalho || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(empresa)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(empresa)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <EmpresaModal
        open={open}
        onOpenChange={setOpen}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["empresas"] })}
        empresa={editEmpresa}
      />

      {/* Delete confirmation modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a empresa <strong>{deleteConfirm?.nome_fantasia || deleteConfirm?.razao_social}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
