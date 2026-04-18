import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

type AppRole = "admin" | "usuario";

interface UsuarioRow {
  user_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  role: AppRole;
}

export default function Usuarios() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<UsuarioRow | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", password: "", role: "usuario" as AppRole, ativo: true });

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id,nome,email,ativo").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const roleMap = new Map<string, AppRole>();
    (roles ?? []).forEach((r: any) => {
      const cur = roleMap.get(r.user_id);
      if (!cur || r.role === "admin") roleMap.set(r.user_id, r.role);
    });
    setRows((profiles ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.user_id) ?? "usuario" })));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!authLoading && !isAdmin) return <Navigate to="/empresas" replace />;

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", email: "", password: "", role: "usuario", ativo: true });
    setOpen(true);
  };

  const openEdit = (row: UsuarioRow) => {
    setEditing(row);
    setForm({ nome: row.nome, email: row.email, password: "", role: row.role, ativo: row.ativo });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e email obrigatórios"); return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Atualiza profile
        const { error: pErr } = await supabase.from("profiles")
          .update({ nome: form.nome, ativo: form.ativo })
          .eq("user_id", editing.user_id);
        if (pErr) throw pErr;
        // Atualiza role
        if (form.role !== editing.role) {
          await supabase.from("user_roles").delete().eq("user_id", editing.user_id);
          await supabase.from("user_roles").insert({ user_id: editing.user_id, role: form.role });
        }
        toast.success("Usuário atualizado");
      } else {
        if (form.password.length < 6) { toast.error("Senha mínima 6 caracteres"); setSaving(false); return; }
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { emailRedirectTo: redirectUrl, data: { nome: form.nome } },
        });
        if (error) throw error;
        // Promove para admin se necessário (trigger sempre cria como 'usuario')
        if (form.role === "admin" && data.user) {
          await supabase.from("user_roles").delete().eq("user_id", data.user.id);
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
        }
        // Ajusta ativo se necessário
        if (!form.ativo && data.user) {
          await supabase.from("profiles").update({ ativo: false }).eq("user_id", data.user.id);
        }
        toast.success("Usuário criado. Email de confirmação enviado.");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: UsuarioRow) => {
    if (!confirm(`Excluir usuário ${row.nome}? O acesso será removido.`)) return;
    // Remove profile + roles (auth.users só pode ser excluído via service role)
    const { error: rErr } = await supabase.from("user_roles").delete().eq("user_id", row.user_id);
    const { error: pErr } = await supabase.from("profiles").update({ ativo: false }).eq("user_id", row.user_id);
    if (rErr || pErr) { toast.error("Erro ao excluir"); return; }
    toast.success("Usuário desativado");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie acessos ao sistema</p>
        </div>
        <Button onClick={openNew} className="btn-premium">
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Lista de usuários</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                    <TableCell>
                      <Badge variant={r.role === "admin" ? "default" : "secondary"} className="gap-1">
                        {r.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {r.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.ativo ? "default" : "outline"} className={r.ativo ? "bg-success text-success-foreground" : ""}>
                        {r.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(r)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} disabled={!!editing}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Usuário ativo</Label>
                <p className="text-xs text-muted-foreground">Inativos não conseguem acessar</p>
              </div>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="btn-premium">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
