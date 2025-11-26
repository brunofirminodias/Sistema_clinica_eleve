import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, User } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, addWeeks, addMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
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

type ViewMode = "dia" | "semana" | "mes" | "ano";

const AgendamentosKanban = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("semana");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchAgendamentos();
  }, [currentDate, viewMode]);

  const fetchAgendamentos = async () => {
    setLoading(true);
    
    let startDate: Date;
    let endDate: Date;

    switch (viewMode) {
      case "dia":
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
        break;
      case "semana":
        startDate = startOfWeek(currentDate, { locale: ptBR });
        endDate = endOfWeek(currentDate, { locale: ptBR });
        break;
      case "mes":
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case "ano":
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
    }

    const { data, error } = await supabase
      .from("agendamentos")
      .select(`
        *,
        pacientes (nome_completo)
      `)
      .gte("data_hora", startDate.toISOString())
      .lte("data_hora", endDate.toISOString())
      .order("data_hora");

    if (error) {
      toast.error("Erro ao carregar agendamentos");
    } else {
      setAgendamentos(data || []);
    }
    setLoading(false);
  };

  const getColumns = () => {
    const startDate = viewMode === "dia" ? startOfDay(currentDate)
      : viewMode === "semana" ? startOfWeek(currentDate, { locale: ptBR })
      : viewMode === "mes" ? startOfMonth(currentDate)
      : startOfYear(currentDate);

    const endDate = viewMode === "dia" ? endOfDay(currentDate)
      : viewMode === "semana" ? endOfWeek(currentDate, { locale: ptBR })
      : viewMode === "mes" ? endOfMonth(currentDate)
      : endOfYear(currentDate);

    switch (viewMode) {
      case "dia":
        return [{
          date: currentDate,
          label: format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
        }];
      case "semana":
        return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
          date,
          label: format(date, "EEE dd/MM", { locale: ptBR })
        }));
      case "mes":
        return eachWeekOfInterval({ start: startDate, end: endDate }).map((date, index) => ({
          date,
          label: `Semana ${index + 1}`
        }));
      case "ano":
        return eachMonthOfInterval({ start: startDate, end: endDate }).map(date => ({
          date,
          label: format(date, "MMMM", { locale: ptBR })
        }));
    }
  };

  const getAgendamentosForColumn = (columnDate: Date) => {
    return agendamentos.filter(agendamento => {
      const agendamentoDate = new Date(agendamento.data_hora);
      
      switch (viewMode) {
        case "dia":
          return startOfDay(agendamentoDate).getTime() === startOfDay(columnDate).getTime();
        case "semana":
          return startOfDay(agendamentoDate).getTime() === startOfDay(columnDate).getTime();
        case "mes":
          const weekStart = startOfWeek(columnDate, { locale: ptBR });
          const weekEnd = endOfWeek(columnDate, { locale: ptBR });
          return agendamentoDate >= weekStart && agendamentoDate <= weekEnd;
        case "ano":
          return agendamentoDate.getMonth() === columnDate.getMonth();
      }
    });
  };

  const navigatePeriod = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "dia":
        setCurrentDate(direction === "next" ? addDays(newDate, 1) : addDays(newDate, -1));
        break;
      case "semana":
        setCurrentDate(direction === "next" ? addWeeks(newDate, 1) : addWeeks(newDate, -1));
        break;
      case "mes":
        setCurrentDate(direction === "next" ? addMonths(newDate, 1) : addMonths(newDate, -1));
        break;
      case "ano":
        newDate.setFullYear(direction === "next" ? newDate.getFullYear() + 1 : newDate.getFullYear() - 1);
        setCurrentDate(newDate);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      agendado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      confirmado: "bg-green-500/10 text-green-600 border-green-500/20",
      cancelado: "bg-red-500/10 text-red-600 border-red-500/20",
      concluido: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return colors[status] || colors.agendado;
  };

  const getPeriodLabel = () => {
    switch (viewMode) {
      case "dia":
        return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case "semana":
        const weekStart = startOfWeek(currentDate, { locale: ptBR });
        const weekEnd = endOfWeek(currentDate, { locale: ptBR });
        return `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`;
      case "mes":
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      case "ano":
        return format(currentDate, "yyyy");
    }
  };

  const columns = getColumns();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda Visual</h1>
          <p className="text-muted-foreground">Visualização tipo Kanban dos agendamentos</p>
        </div>
        
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="dia">Dia</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigatePeriod("prev")}>
              ← Anterior
            </Button>
            <CardTitle className="text-xl capitalize">{getPeriodLabel()}</CardTitle>
            <Button variant="outline" onClick={() => navigatePeriod("next")}>
              Próximo →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-4 border border-border"
                >
                  <div className="mb-4 pb-2 border-b border-border">
                    <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {column.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getAgendamentosForColumn(column.date).length} agendamento(s)
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {getAgendamentosForColumn(column.date).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum agendamento
                      </p>
                    ) : (
                      getAgendamentosForColumn(column.date).map((agendamento) => (
                        <Card
                          key={agendamento.id}
                          className="transition-all hover:shadow-md cursor-pointer"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <User className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="font-semibold text-sm line-clamp-2">
                                  {agendamento.pacientes?.nome_completo}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs flex-shrink-0 ${getStatusColor(agendamento.status)}`}
                              >
                                {agendamento.status}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(agendamento.data_hora), "HH:mm", { locale: ptBR })}
                            </div>

                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-medium text-primary">
                                {agendamento.tipo_consulta}
                              </p>
                              {agendamento.observacoes && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {agendamento.observacoes}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">Agendado</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {agendamentos.filter(a => a.status === "agendado").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Confirmado</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {agendamentos.filter(a => a.status === "confirmado").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Cancelado</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {agendamentos.filter(a => a.status === "cancelado").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm font-medium">Concluído</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {agendamentos.filter(a => a.status === "concluido").length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendamentosKanban;
