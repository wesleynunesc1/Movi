-- ==============================================================================
-- MOVI — Gestão Comercial Inteligente
-- Migração Inicial: Perfis, Multiempresa, Membros, Configurações e RLS
-- ==============================================================================

-- 1. Tabela de Perfis de Usuário
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabela de Empresas (Multiempresa / Multitenant)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  business_type text not null default 'Geral',
  currency text not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabela de Membros da Empresa (RBAC com isolamento)
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'manager', 'cashier')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- 4. Tabela de Configurações da Empresa
create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  logo_url text,
  primary_color text not null default '#FFD600',
  phone text,
  whatsapp text,
  address text,
  city text,
  state text,
  business_document text,
  updated_at timestamptz not null default now()
);

-- Índices de performance
create index if not exists idx_companies_owner on public.companies(owner_user_id);
create index if not exists idx_company_members_user on public.company_members(user_id);
create index if not exists idx_company_members_company on public.company_members(company_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_settings enable row level security;

-- Políticas de Profiles
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Políticas de Companies
create policy "Membros podem ver suas empresas"
  on public.companies for select
  using (
    id in (
      select company_id from public.company_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Proprietários podem criar empresas"
  on public.companies for insert
  with check (auth.uid() = owner_user_id);

create policy "Proprietários podem atualizar suas empresas"
  on public.companies for update
  using (auth.uid() = owner_user_id);

-- Políticas de Company Members
create policy "Membros podem ver outros membros da mesma empresa"
  on public.company_members for select
  using (
    company_id in (
      select company_id from public.company_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Somente proprietários podem gerenciar membros"
  on public.company_members for insert
  with check (
    exists (
      select 1 from public.companies
      where id = company_id and owner_user_id = auth.uid()
    )
    or user_id = auth.uid() -- Permite autofilia no onboarding inicial
  );

create policy "Somente proprietários podem atualizar membros"
  on public.company_members for update
  using (
    exists (
      select 1 from public.companies
      where id = company_id and owner_user_id = auth.uid()
    )
  );

-- Políticas de Company Settings
create policy "Membros podem ver configurações da empresa"
  on public.company_settings for select
  using (
    company_id in (
      select company_id from public.company_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Proprietários podem atualizar configurações da empresa"
  on public.company_settings for update
  using (
    exists (
      select 1 from public.companies
      where id = company_id and owner_user_id = auth.uid()
    )
  );

create policy "Permitir inserção de configurações pelo proprietário"
  on public.company_settings for insert
  with check (
    exists (
      select 1 from public.companies
      where id = company_id and owner_user_id = auth.uid()
    )
  );

-- ==============================================================================
-- TRIGGER PARA SINCRONIZAÇÃO DE PERFIL AUTOMÁTICO
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, full_name, avatar_url)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
