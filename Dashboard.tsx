import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPacientes: 0,
    agendamentosHoje: 0,
    agendamentosProximos: 0,
    concluidos: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const [pacientesRes, agendamentosHojeRes, agendamentosProximosRes, concluidosRes] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact", head: true }),
        supabase
          .from("agendamentos")
          .select("id", { count: "exact", head: true })
          .gte("data_hora", hoje.toISOString())
          .lt("data_hora", amanha.toISOString())
          .neq("status", "cancelado"),
        supabase
          .from("agendamentos")
          .select("id", { count: "exact", head: true })
          .gte("data_hora", amanha.toISOString())
          .in("status", ["agendado", "confirmado"]),
        supabase
          .from("agendamentos")
          .select("id", { count: "exact", head: true })
          .eq("status", "concluido"),
      ]);

      setStats({
        totalPacientes: pacientesRes.count || 0,
        agendamentosHoje: agendamentosHojeRes.count || 0,
        agendamentosProximos: agendamentosProximosRes.count || 0,
        concluidos: concluidosRes.count || 0,
      });
    } catch (error) {
      toast.error("Erro ao carregar estatísticas");
    }

    setLoading(false);
  };

  const statCards = [
    {
      title: "Total de Pacientes",
      value: stats.totalPacientes,
      icon: Users,
      description: "Pacientes cadastrados",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Agendamentos Hoje",
      value: stats.agendamentosHoje,
      icon: Calendar,
      description: "Consultas para hoje",
      gradient: "from-primary to-primary/70",
    },
    {
      title: "Próximos Agendamentos",
      value: stats.agendamentosProximos,
      icon: Clock,
      description: "Consultas futuras",
      gradient: "from-secondary to-secondary/70",
    },
    {
      title: "Concluídos",
      value: stats.concluidos,
      icon: CheckCircle,
      description: "Total de consultas realizadas",
      gradient: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da clínica</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="relative overflow-hidden transition-all hover:shadow-lg">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full bg-gradient-to-br ${card.gradient}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <CardDescription className="mt-1">{card.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este é o sistema de gestão da clínica odontológica. Use o menu acima para navegar
              entre as diferentes funcionalidades:
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span><strong>Pacientes:</strong> Cadastre e gerencie os pacientes</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span><strong>Agendamentos:</strong> Crie e organize consultas</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span><strong>Pagamentos:</strong> Veja as formas de pagamento aceitas</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Dicas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="font-bold text-primary">1.</span>
              <p>Sempre confirme os dados do paciente antes de criar um agendamento</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">2.</span>
              <p>Use a busca na página de pacientes para encontrar rapidamente por nome, CPF ou telefone</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">3.</span>
              <p>Mantenha o status dos agendamentos sempre atualizado</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">4.</span>
              <p>Em caso de dúvidas, consulte o administrador do sistema</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
