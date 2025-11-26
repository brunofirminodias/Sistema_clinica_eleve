import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  data_hora: string;
  tipo_consulta: string;
  status: string;
  observacoes: string | null;
  pacientes: {
    nome_completo: string;
  };
}

interface Paciente {
  id: string;
  nome_completo: string;
}

const Agendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  
  const [formData, setFormData] = useState({
    paciente_id: "",
    data_hora: "",
    tipo_consulta: "",
    status: "agendado",
    observacoes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [agendamentosRes, pacientesRes] = await Promise.all([
      supabase
        .from("agendamentos")
        .select(`
          *,
          pacientes (nome_completo)
        `)
        .order("data_hora", { ascending: true }),
      supabase
        .from("pacientes")
        .select("id, nome_completo")
        .order("nome_completo")
    ]);

    if (agendamentosRes.error) {
      toast.error("Erro ao carregar agendamentos");
    } else {
      setAgendamentos(agendamentosRes.data || []);
    }

    if (pacientesRes.error) {
      toast.error("Erro ao carregar pacientes");
    } else {
      setPacientes(pacientesRes.data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAgendamento) {
      const { error } = await supabase
        .from("agendamentos")
        .update({
          paciente_id: formData.paciente_id,
          data_hora: formData.data_hora,
          tipo_consulta: formData.tipo_consulta,
          status: formData.status,
          observacoes: formData.observacoes || null,
        })
        .eq("id", editingAgendamento.id);

      if (error) {
        toast.error("Erro ao atualizar agendamento");
      } else {
        toast.success("Agendamento atualizado com sucesso!");
        fetchData();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("agendamentos")
        .insert([{
          paciente_id: formData.paciente_id,
          data_hora: formData.data_hora,
          tipo_consulta: formData.tipo_consulta,
          status: formData.status,
          observacoes: formData.observacoes || null,
        }]);

      if (error) {
        toast.error("Erro ao criar agendamento");
      } else {
        toast.success("Agendamento criado com sucesso!");
        fetchData();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este agendamento?")) {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Erro ao excluir agendamento");
      } else {
        toast.success("Agendamento excluído com sucesso!");
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: "",
      data_hora: "",
      tipo_consulta: "",
      status: "agendado",
      observacoes: "",
    });
    setEditingAgendamento(null);
    setDialogOpen(false);
  };

  const openEditDialog = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setFormData({
      paciente_id: agendamento.pacientes ? (agendamento as any).paciente_id : "",
      data_hora: agendamento.data_hora.slice(0, 16),
      tipo_consulta: agendamento.tipo_consulta,
      status: agendamento.status,
      observacoes: agendamento.observacoes || "",
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      agendado: "default",
      confirmado: "secondary",
      cancelado: "destructive",
      concluido: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAgendamento ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do agendamento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_id">Paciente *</Label>
                <Select
                  value={formData.paciente_id}
                  onValueChange={(value) => setFormData({...formData, paciente_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        {paciente.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_hora">Data e Hora *</Label>
                <Input
                  id="data_hora"
                  type="datetime-local"
                  value={formData.data_hora}
                  onChange={(e) => setFormData({...formData, data_hora: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_consulta">Tipo de Consulta *</Label>
                <Input
                  id="tipo_consulta"
                  value={formData.tipo_consulta}
                  onChange={(e) => setFormData({...formData, tipo_consulta: e.target.value})}
                  placeholder="Ex: Limpeza, Canal, Extração"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
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
                  {editingAgendamento ? "Atualizar" : "Agendar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
          <CardDescription>
            Todos os agendamentos da clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendamentos.map((agendamento) => (
                    <TableRow key={agendamento.id}>
                      <TableCell className="font-medium">
                        {agendamento.pacientes?.nome_completo}
                      </TableCell>
                      <TableCell>
                        {format(new Date(agendamento.data_hora), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{agendamento.tipo_consulta}</TableCell>
                      <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(agendamento)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(agendamento.id)}
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

export default Agendamentos;
