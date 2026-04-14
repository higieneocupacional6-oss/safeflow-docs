import { useState } from "react";
import { Plus, Search, Building2, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Empresas() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

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

  const handleDelete = async (id: string) => {
    await supabase.from("empresas").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["empresas"] });
    toast.success("Empresa removida");
  };

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas cadastradas no sistema"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Nova Empresa
          </Button>
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
                <TableHead className="hidden md:table-cell">CNAE</TableHead>
                <TableHead className="hidden sm:table-cell">Grau Risco</TableHead>
                <TableHead className="hidden sm:table-cell">Funcionários</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmpresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
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
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{empresa.cnae_principal}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {empresa.grau_risco && <Badge variant="secondary">GR {empresa.grau_risco}</Badge>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{empresa.total_funcionarios || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(empresa.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <EmpresaModal open={open} onOpenChange={setOpen} onSaved={() => queryClient.invalidateQueries({ queryKey: ["empresas"] })} />
    </div>
  );
}
