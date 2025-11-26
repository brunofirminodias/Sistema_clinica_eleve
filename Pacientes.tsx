import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, UserPlus, Search, Pencil, Trash2 } from "lucide-react";

interface Paciente {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
}

const Pacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    email: "",
    endereco: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .order("nome_completo");

    if (error) {
      toast.error("Erro ao carregar pacientes");
    } else {
      setPacientes(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPaciente) {
      const { error } = await supabase
        .from("pacientes")
        .update(formData)
        .eq("id", editingPaciente.id);

      if (error) {
        toast.error("Erro ao atualizar paciente");
      } else {
        toast.success("Paciente atualizado com sucesso!");
        fetchPacientes();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("pacientes")
        .insert([formData]);

      if (error) {
        toast.error("Erro ao cadastrar paciente: " + error.message);
      } else {
        toast.success("Paciente cadastrado com sucesso!");
        fetchPacientes();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este paciente?")) {
      const { error } = await supabase
        .from("pacientes")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Erro ao excluir paciente");
      } else {
        toast.success("Paciente excluído com sucesso!");
        fetchPacientes();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      cpf: "",
      data_nascimento: "",
      telefone: "",
      email: "",
      endereco: "",
      observacoes: "",
    });
    setEditingPaciente(null);
    setDialogOpen(false);
  };

  const openEditDialog = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormData({
      nome_completo: paciente.nome_completo,
      cpf: paciente.cpf,
      data_nascimento: paciente.data_nascimento,
      telefone: paciente.telefone,
      email: paciente.email || "",
      endereco: paciente.endereco || "",
      observacoes: paciente.observacoes || "",
    });
    setDialogOpen(true);
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm) ||
    p.telefone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os pacientes da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPaciente ? "Editar Paciente" : "Novo Paciente"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do paciente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPaciente ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPacientes.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">{paciente.nome_completo}</TableCell>
                      <TableCell>{paciente.cpf}</TableCell>
                      <TableCell>{paciente.telefone}</TableCell>
                      <TableCell>{paciente.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(paciente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(paciente.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Pacientes;
