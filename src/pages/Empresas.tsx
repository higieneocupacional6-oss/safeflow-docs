import { useState } from "react";
import { Plus, Search, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  cnae: string;
  colaboradores: string;
}

const mockEmpresas: Empresa[] = [
  {
    id: "1",
    cnpj: "12.345.678/0001-90",
    razaoSocial: "Construtora Alpha Ltda",
    nomeFantasia: "Alpha Construções",
    endereco: "Rua das Palmeiras, 500 - São Paulo/SP",
    cnae: "41.20-4-00 - Construção de edifícios",
    colaboradores: "120",
  },
  {
    id: "2",
    cnpj: "98.765.432/0001-10",
    razaoSocial: "Indústria Beta S.A.",
    nomeFantasia: "Beta Industrial",
    endereco: "Av. Industrial, 1200 - Guarulhos/SP",
    cnae: "25.11-0-00 - Fabricação de estruturas metálicas",
    colaboradores: "350",
  },
];

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>(mockEmpresas);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    endereco: "",
    cnae: "",
    colaboradores: "",
  });

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
      e.cnpj.includes(search)
  );

  const handleCnpjLookup = async () => {
    const cleanCnpj = form.cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        razaoSocial: data.razao_social || "",
        nomeFantasia: data.nome_fantasia || "",
        endereco: `${data.logradouro || ""}, ${data.numero || ""} - ${data.municipio || ""}/${data.uf || ""}`,
        cnae: `${data.cnae_fiscal || ""} - ${data.cnae_fiscal_descricao || ""}`,
      }));
      toast.success("Dados carregados com sucesso!");
    } catch {
      toast.error("Erro ao buscar CNPJ. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!form.razaoSocial) {
      toast.error("Preencha a Razão Social");
      return;
    }
    const newEmpresa: Empresa = {
      id: Date.now().toString(),
      ...form,
    };
    setEmpresas((prev) => [...prev, newEmpresa]);
    setOpen(false);
    setForm({ cnpj: "", razaoSocial: "", nomeFantasia: "", endereco: "", cnae: "", colaboradores: "" });
    toast.success("Empresa cadastrada com sucesso!");
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas cadastradas no sistema"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        }
      />

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">CNAE</TableHead>
              <TableHead className="hidden sm:table-cell">Colaboradores</TableHead>
              <TableHead className="w-12"></TableHead>
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
              filteredEmpresas.map((empresa) => (
                <TableRow key={empresa.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{empresa.nomeFantasia || empresa.razaoSocial}</p>
                      <p className="text-xs text-muted-foreground">{empresa.razaoSocial}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{empresa.cnpj}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                    {empresa.cnae}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{empresa.colaboradores}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Nova Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>CNPJ</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })}
                />
                <Button onClick={handleCnpjLookup} disabled={loading} variant="outline" className="shrink-0">
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Nome Fantasia</Label>
              <Input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>CNAE Principal</Label>
              <Input value={form.cnae} onChange={(e) => setForm({ ...form, cnae: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Total de Colaboradores</Label>
              <Input type="number" value={form.colaboradores} onChange={(e) => setForm({ ...form, colaboradores: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
