-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types
CREATE TYPE app_role AS ENUM ('manager', 'karyawan', 'pkl');
CREATE TYPE division_type AS ENUM ('konten_kreator', 'host_live', 'model', 'manager');
CREATE TYPE platform_type AS ENUM ('tiktok', 'shopee', 'other');
CREATE TYPE account_type AS ENUM ('affiliate', 'seller');
CREATE TYPE account_status AS ENUM ('active', 'banned', 'pelanggaran', 'not_recommended');
CREATE TYPE period_type AS ENUM ('daily', 'monthly');
CREATE TYPE target_for_type AS ENUM ('user', 'team', 'division');

-- Users metadata table (extends auth.users)
CREATE TABLE public.users_meta (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role app_role NOT NULL DEFAULT 'karyawan',
  division division_type,
  profile JSONB DEFAULT '{}'::jsonb,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  division division_type,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_in_team TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- KPI targets table
CREATE TABLE public.kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_for_type target_for_type NOT NULL,
  target_for_id UUID NOT NULL,
  metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  period period_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accounts table (affiliate accounts with encrypted passwords)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_type NOT NULL,
  username TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password_encrypted BYTEA, -- Encrypted password
  ga_enabled BOOLEAN DEFAULT false,
  account_type account_type NOT NULL,
  birth_date DATE,
  created_date DATE,
  followers BIGINT DEFAULT 0,
  keranjang_kuning BOOLEAN DEFAULT false,
  status account_status DEFAULT 'active',
  managed_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance logs table
CREATE TABLE public.performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  division division_type,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tutorials table
CREATE TABLE public.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  file_path TEXT,
  youtube_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOPs table
CREATE TABLE public.sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tools table
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  spreadsheet_url TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table for security
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_meta
    WHERE id = user_id AND role = 'manager'
  );
$$;

-- Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users_meta WHERE id = user_id;
$$;

-- RLS Policies for users_meta
CREATE POLICY "Users can view their own profile"
  ON public.users_meta FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles"
  ON public.users_meta FOR SELECT
  USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can insert profiles"
  ON public.users_meta FOR INSERT
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers can update profiles"
  ON public.users_meta FOR UPDATE
  USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can delete profiles"
  ON public.users_meta FOR DELETE
  USING (public.is_manager(auth.uid()));

-- RLS Policies for teams
CREATE POLICY "Everyone can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage teams"
  ON public.teams FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for team_members
CREATE POLICY "Everyone can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage team members"
  ON public.team_members FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for kpi_targets
CREATE POLICY "Users can view their own KPI targets"
  ON public.kpi_targets FOR SELECT
  USING (
    target_for_type = 'user' AND target_for_id = auth.uid()
    OR public.is_manager(auth.uid())
  );

CREATE POLICY "Managers can manage KPI targets"
  ON public.kpi_targets FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for accounts (manager-only access)
CREATE POLICY "Managers can view all accounts"
  ON public.accounts FOR SELECT
  USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage accounts"
  ON public.accounts FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for performance_logs
CREATE POLICY "Users can view their own performance"
  ON public.performance_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_manager(auth.uid())
  );

CREATE POLICY "Everyone can insert performance logs"
  ON public.performance_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can manage performance logs"
  ON public.performance_logs FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for tutorials
CREATE POLICY "Everyone can view public tutorials"
  ON public.tutorials FOR SELECT
  USING (is_public = true OR public.is_manager(auth.uid()));

CREATE POLICY "Managers can manage tutorials"
  ON public.tutorials FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for sops
CREATE POLICY "Everyone can view SOPs"
  ON public.sops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage SOPs"
  ON public.sops FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for tools
CREATE POLICY "Everyone can view tools"
  ON public.tools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage tools"
  ON public.tools FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Everyone can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage products"
  ON public.products FOR ALL
  USING (public.is_manager(auth.uid()));

-- RLS Policies for audit_logs (manager-only)
CREATE POLICY "Managers can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_manager(auth.uid()));

CREATE POLICY "Anyone can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_meta_updated_at BEFORE UPDATE ON public.users_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_targets_updated_at BEFORE UPDATE ON public.kpi_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON public.sops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_meta (id, full_name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'karyawan')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_users_meta_role ON public.users_meta(role);
CREATE INDEX idx_users_meta_division ON public.users_meta(division);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_kpi_targets_target_for ON public.kpi_targets(target_for_type, target_for_id);
CREATE INDEX idx_kpi_targets_period ON public.kpi_targets(period, start_date, end_date);
CREATE INDEX idx_accounts_managed_by ON public.accounts(managed_by);
CREATE INDEX idx_accounts_team_id ON public.accounts(team_id);
CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE INDEX idx_performance_logs_date ON public.performance_logs(date);
CREATE INDEX idx_performance_logs_user_id ON public.performance_logs(user_id);
CREATE INDEX idx_performance_logs_team_id ON public.performance_logs(team_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);