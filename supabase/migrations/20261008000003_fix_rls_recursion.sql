-- ==============================================================================
-- MOVI — Correção de Políticas RLS (Eliminação de Recursão Infinita)
-- Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. Funções Security Definer Auxiliares (Bypass RLS para evitar loops recursivos)
create or replace function public.is_company_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_company_owner(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.companies
    where id = cid and owner_user_id = auth.uid()
  );
$$;

-- 2. Remover políticas antigas com potenciais loops
drop policy if exists "Membros podem ver suas empresas" on public.companies;
drop policy if exists "Proprietários podem criar empresas" on public.companies;
drop policy if exists "Proprietários podem atualizar suas empresas" on public.companies;

drop policy if exists "Membros podem ver outros membros da mesma empresa" on public.company_members;
drop policy if exists "Somente proprietários podem gerenciar membros" on public.company_members;
drop policy if exists "Somente proprietários podem atualizar membros" on public.company_members;

drop policy if exists "Membros podem ver configurações da empresa" on public.company_settings;
drop policy if exists "Proprietários podem atualizar configurações da empresa" on public.company_settings;
drop policy if exists "Permitir inserção de configurações pelo proprietário" on public.company_settings;

-- 3. Recriar Políticas Seguras e Otimizadas (Zero Recursão)

-- --- COMPANIES ---
create policy "companies_select_policy"
  on public.companies for select
  using (
    owner_user_id = auth.uid() or public.is_company_member(id)
  );

create policy "companies_insert_policy"
  on public.companies for insert
  with check (
    owner_user_id = auth.uid()
  );

create policy "companies_update_policy"
  on public.companies for update
  using (
    owner_user_id = auth.uid()
  );

-- --- COMPANY_MEMBERS ---
create policy "company_members_select_policy"
  on public.company_members for select
  using (
    user_id = auth.uid() or public.is_company_member(company_id)
  );

create policy "company_members_insert_policy"
  on public.company_members for insert
  with check (
    user_id = auth.uid() or public.is_company_owner(company_id)
  );

create policy "company_members_update_policy"
  on public.company_members for update
  using (
    public.is_company_owner(company_id)
  );

-- --- COMPANY_SETTINGS ---
create policy "company_settings_select_policy"
  on public.company_settings for select
  using (
    public.is_company_member(company_id) or public.is_company_owner(company_id)
  );

create policy "company_settings_insert_policy"
  on public.company_settings for insert
  with check (
    public.is_company_owner(company_id)
  );

create policy "company_settings_update_policy"
  on public.company_settings for update
  using (
    public.is_company_owner(company_id)
  );
