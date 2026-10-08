-- ==============================================================================
-- MOVI — Criação Atômica de Empresa e Configuração Inicial (RPC)
-- ==============================================================================

create or replace function public.create_company_atomic(
  p_name text,
  p_business_type text default 'Geral',
  p_phone text default null,
  p_whatsapp text default null,
  p_city text default null,
  p_state text default null,
  p_logo_url text default null,
  p_primary_color text default '#FFD600'
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_company_id uuid;
  v_slug text;
  v_slug_base text;
  v_counter int := 0;
begin
  -- Obter usuário autenticado
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Operação não autorizada. Sessão necessária.';
  end if;

  -- Gerar slug amigável
  v_slug_base := lower(regexp_replace(regexp_replace(p_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  if length(v_slug_base) = 0 then
    v_slug_base := 'empresa';
  end if;
  v_slug := v_slug_base;

  -- Garantir unicidade do slug
  while exists (select 1 from public.companies where slug = v_slug) loop
    v_counter := v_counter + 1;
    v_slug := v_slug_base || '-' || v_counter;
  end loop;

  -- 1. Inserir empresa
  insert into public.companies (
    name,
    slug,
    owner_user_id,
    business_type,
    currency,
    timezone
  ) values (
    p_name,
    v_slug,
    v_user_id,
    coalesce(p_business_type, 'Geral'),
    'BRL',
    'America/Sao_Paulo'
  ) returning id into v_company_id;

  -- 2. Vincular membro proprietário
  insert into public.company_members (
    company_id,
    user_id,
    role,
    status
  ) values (
    v_company_id,
    v_user_id,
    'owner',
    'active'
  );

  -- 3. Inserir configurações iniciais
  insert into public.company_settings (
    company_id,
    logo_url,
    primary_color,
    phone,
    whatsapp,
    city,
    state
  ) values (
    v_company_id,
    p_logo_url,
    coalesce(p_primary_color, '#FFD600'),
    p_phone,
    p_whatsapp,
    p_city,
    p_state
  );

  return json_build_object(
    'id', v_company_id,
    'name', p_name,
    'slug', v_slug,
    'role', 'owner'
  );
end;
$$;
