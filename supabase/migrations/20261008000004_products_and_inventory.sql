-- ==============================================================================
-- MOVI — ETAPA 02: Gestão de Produtos, Categorias, Variações e Estoque
-- Migração PostgreSQL com RLS e Função Transacional de Movimentação de Estoque
-- ==============================================================================

-- 1. Categorias de Produtos
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- 2. Produtos Principais
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  description text,
  brand text,
  sku text not null,
  barcode text,
  unit text not null default 'UN',
  cost_price numeric(12, 2) not null default 0.00,
  sale_price numeric(12, 2) not null default 0.00,
  promotional_price numeric(12, 2),
  track_inventory boolean not null default true,
  has_variants boolean not null default false,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);

-- 3. Imagens dos Produtos
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Atributos de Variação (ex: Cor, Tamanho)
create table if not exists public.product_variant_attributes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- 5. Valores dos Atributos (ex: Preto, Branco, P, M, G)
create table if not exists public.product_variant_values (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  attribute_id uuid not null references public.product_variant_attributes(id) on delete cascade,
  value text not null,
  created_at timestamptz not null default now()
);

-- 6. Combinações / Variantes de Produtos
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  barcode text,
  combination_key text not null, -- ex: "Preto / M"
  cost_price_override numeric(12, 2),
  sale_price_override numeric(12, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);

-- 7. Itens de Estoque (Fonte Única de Verdade de Saldo)
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity_on_hand numeric(12, 3) not null default 0.000,
  minimum_quantity numeric(12, 3) not null default 0.000,
  location text,
  updated_at timestamptz not null default now(),
  unique (company_id, product_id, variant_id)
);

-- 8. Histórico Imutável de Movimentações de Estoque (Auditoria)
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('entry', 'exit', 'adjustment', 'initial', 'sale', 'return')),
  quantity_delta numeric(12, 3) not null,
  quantity_before numeric(12, 3) not null,
  quantity_after numeric(12, 3) not null,
  reason text not null,
  notes text,
  performed_by uuid references auth.users(id) on delete set null,
  reference_type text,
  reference_id text,
  idempotency_key text,
  created_at timestamptz not null default now()
);

-- Índices de Alta Performance
create index if not exists idx_products_company on public.products(company_id);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_sku on public.products(company_id, sku);
create index if not exists idx_products_barcode on public.products(company_id, barcode);
create index if not exists idx_inventory_items_lookup on public.inventory_items(company_id, product_id, variant_id);
create index if not exists idx_inventory_movements_item on public.inventory_movements(inventory_item_id);
create index if not exists idx_inventory_movements_created on public.inventory_movements(created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variant_attributes enable row level security;
alter table public.product_variant_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

-- Policies para Categories
create policy "cat_select" on public.product_categories for select using (public.is_company_member(company_id));
create policy "cat_insert" on public.product_categories for insert with check (public.is_company_member(company_id));
create policy "cat_update" on public.product_categories for update using (public.is_company_member(company_id));
create policy "cat_delete" on public.product_categories for delete using (public.is_company_owner(company_id));

-- Policies para Products (com validação do limite de 200 produtos do Plano Free)
create policy "prod_select" on public.products for select using (public.is_company_member(company_id));
create policy "prod_insert" on public.products for insert with check (
  public.is_company_member(company_id)
  and (
    select count(*) from public.products
    where company_id = products.company_id and archived_at is null
  ) < 200
);
create policy "prod_update" on public.products for update using (public.is_company_member(company_id));
create policy "prod_delete" on public.products for delete using (public.is_company_owner(company_id));

-- Policies para Imagens
create policy "img_all" on public.product_images for all using (public.is_company_member(company_id));

-- Policies para Variantes
create policy "attr_all" on public.product_variant_attributes for all using (public.is_company_member(company_id));
create policy "val_all" on public.product_variant_values for all using (public.is_company_member(company_id));
create policy "var_all" on public.product_variants for all using (public.is_company_member(company_id));

-- Policies para Itens de Estoque e Movimentações
create policy "inv_item_all" on public.inventory_items for all using (public.is_company_member(company_id));
create policy "inv_mov_select" on public.inventory_movements for select using (public.is_company_member(company_id));
create policy "inv_mov_insert" on public.inventory_movements for insert with check (public.is_company_member(company_id));

-- ==============================================================================
-- FUNÇÃO TRANSACIONAL ATÔMICA: MOVIMENTAÇÃO DE ESTOQUE
-- ==============================================================================
create or replace function public.record_inventory_movement(
  p_company_id uuid,
  p_product_id uuid,
  p_variant_id uuid default null,
  p_movement_type text default 'entry',
  p_quantity numeric default 0,
  p_reason text default 'Ajuste manual',
  p_notes text default null,
  p_idempotency_key text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_item_id uuid;
  v_current_qty numeric;
  v_new_qty numeric;
  v_delta numeric;
  v_movement_id uuid;
begin
  -- 1. Validar autorização
  if not public.is_company_member(p_company_id) then
    raise exception 'Acesso negado para esta empresa.';
  end if;

  -- 2. Verificar idempotência se chave fornecida
  if p_idempotency_key is not null then
    select id into v_movement_id from public.inventory_movements
    where company_id = p_company_id and idempotency_key = p_idempotency_key;
    if v_movement_id is not null then
      return json_build_object('success', true, 'movement_id', v_movement_id, 'idempotent', true);
    end if;
  end if;

  -- 3. Obter ou criar item de estoque com LOCK de concorrência (FOR UPDATE)
  select id, quantity_on_hand into v_item_id, v_current_qty
  from public.inventory_items
  where company_id = p_company_id
    and product_id = p_product_id
    and ((p_variant_id is null and variant_id is null) or (variant_id = p_variant_id))
  for update;

  if v_item_id is null then
    insert into public.inventory_items (
      company_id, product_id, variant_id, quantity_on_hand, minimum_quantity
    ) values (
      p_company_id, p_product_id, p_variant_id, 0, 0
    ) returning id, quantity_on_hand into v_item_id, v_current_qty;
  end if;

  -- 4. Calcular delta e novo saldo
  if p_movement_type in ('entry', 'initial', 'return') then
    v_delta := abs(p_quantity);
    v_new_qty := v_current_qty + v_delta;
  elsif p_movement_type in ('exit', 'sale') then
    v_delta := -abs(p_quantity);
    v_new_qty := v_current_qty + v_delta;
    if v_new_qty < 0 then
      raise exception 'Saldo insuficiente em estoque. Disponível: %, Solicitado: %', v_current_qty, abs(p_quantity);
    end if;
  elsif p_movement_type = 'adjustment' then
    v_new_qty := p_quantity;
    if v_new_qty < 0 then
      raise exception 'Ajuste de estoque não pode resultar em valor negativo.';
    end if;
    v_delta := v_new_qty - v_current_qty;
  else
    raise exception 'Tipo de movimentação inválido: %', p_movement_type;
  end if;

  -- 5. Atualizar saldo no item de estoque
  update public.inventory_items
  set quantity_on_hand = v_new_qty, updated_at = now()
  where id = v_item_id;

  -- 6. Inserir registro imutável no histórico de auditoria
  insert into public.inventory_movements (
    company_id,
    inventory_item_id,
    movement_type,
    quantity_delta,
    quantity_before,
    quantity_after,
    reason,
    notes,
    performed_by,
    idempotency_key
  ) values (
    p_company_id,
    v_item_id,
    p_movement_type,
    v_delta,
    v_current_qty,
    v_new_qty,
    p_reason,
    p_notes,
    auth.uid(),
    p_idempotency_key
  ) returning id into v_movement_id;

  return json_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'quantity_before', v_current_qty,
    'quantity_after', v_new_qty,
    'delta', v_delta
  );
end;
$$;
