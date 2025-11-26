-- Tabela de perfis de funcionários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT DEFAULT 'atendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pacientes
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  data_nascimento DATE NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.profiles(id),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo_consulta TEXT NOT NULL,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de formas de pagamento
CREATE TABLE public.formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir formas de pagamento padrão
INSERT INTO public.formas_pagamento (nome, descricao) VALUES
  ('Dinheiro', 'Pagamento em dinheiro na recepção'),
  ('Cartão de Débito', 'Pagamento com cartão de débito'),
  ('Cartão de Crédito', 'Pagamento com cartão de crédito (até 12x)'),
  ('PIX', 'Pagamento instantâneo via PIX'),
  ('Convênio', 'Pagamento via convênio odontológico');

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Funcionários podem ver todos os perfis" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem atualizar seu próprio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policies para pacientes
CREATE POLICY "Funcionários podem ver todos os pacientes" 
  ON public.pacientes FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem criar pacientes" 
  ON public.pacientes FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem atualizar pacientes" 
  ON public.pacientes FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem deletar pacientes" 
  ON public.pacientes FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para agendamentos
CREATE POLICY "Funcionários podem ver todos os agendamentos" 
  ON public.agendamentos FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem criar agendamentos" 
  ON public.agendamentos FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem atualizar agendamentos" 
  ON public.agendamentos FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Funcionários podem deletar agendamentos" 
  ON public.agendamentos FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para formas de pagamento (somente leitura)
CREATE POLICY "Funcionários podem ver formas de pagamento" 
  ON public.formas_pagamento FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agendamentos_updated_at
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função e trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Funcionário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();