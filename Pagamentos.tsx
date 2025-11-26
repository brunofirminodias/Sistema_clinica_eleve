import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CreditCard, Banknote, Smartphone, Building2, DollarSign } from "lucide-react";

interface FormaPagamento {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

const Pagamentos = () => {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormasPagamento();
  }, []);

  const fetchFormasPagamento = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("formas_pagamento")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar formas de pagamento");
    } else {
      setFormasPagamento(data || []);
    }
    setLoading(false);
  };

  const getIcon = (nome: string) => {
    const iconMap: Record<string, any> = {
      "Dinheiro": Banknote,
      "Cartão de Débito": CreditCard,
      "Cartão de Crédito": CreditCard,
      "PIX": Smartphone,
      "Convênio": Building2,
    };
    const Icon = iconMap[nome] || DollarSign;
    return <Icon className="h-8 w-8" />;
  };

  const getGradient = (index: number) => {
    const gradients = [
      "from-primary to-primary/70",
      "from-secondary to-secondary/70",
      "from-accent to-accent/70",
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Formas de Pagamento</h1>
        <p className="text-muted-foreground">Métodos de pagamento aceitos pela clínica</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formasPagamento.map((forma, index) => (
            <Card
              key={forma.id}
              className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-105"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getGradient(index)}`}
              />
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-full bg-gradient-to-br ${getGradient(index)} text-white`}>
                  {getIcon(forma.nome)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{forma.nome}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {forma.descricao || "Forma de pagamento disponível"}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Parcelamento</p>
              <p className="text-sm text-muted-foreground">
                Cartão de crédito: parcelamento em até 12x sem juros para procedimentos acima de R$ 500,00
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
            <div>
              <p className="font-medium">PIX</p>
              <p className="text-sm text-muted-foreground">
                Desconto de 5% para pagamentos via PIX à vista
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-accent mt-2" />
            <div>
              <p className="font-medium">Convênios</p>
              <p className="text-sm text-muted-foreground">
                Consulte a recepção para verificar se seu convênio está credenciado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pagamentos;
