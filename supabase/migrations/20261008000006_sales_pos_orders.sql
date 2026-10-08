-- ==============================================================================
-- MOVI — ETAPA 03: VENDAS, PDV, PAGAMENTOS E PEDIDOS
-- ==============================================================================

-- 1. Tabela de Clientes (Estrutura mínima para associação em vendas)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabela de Vendas (Header comercial)
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'completed' check (status in ('draft', 'pending', 'completed', 'partially_returned', 'returned', 'canceled')),
  subtotal_amount numeric(12, 2) not null default 0.00,
  discount_amount numeric(12, 2) not null default 0.00,
  total_amount numeric(12, 2) not null default 0.00,
  payment_status text not null default 'paid' check (payment_status in ('pending', 'paid', 'partially_paid', 'refunded')),
  notes text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  completed_at timestamptz default now(),
  canceled_at timestamptz,
  unique (company_id, sale_number)
);

-- 3. Tabela de Itens da Venda (Snapshots imutáveis)
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  sku_snapshot text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  discount_amount numeric(12, 2) not null default 0.00 check (discount_amount >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

-- 4. Tabela de Pagamentos da Venda (Suporte a pagamento misto e troco)
create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  method text not null check (method in ('money', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
  amount numeric(12, 2) not null check (amount >= 0),
  installments int not null default 1,
  change_amount numeric(12, 2) not null default 0.00,
  confirmation_source text not null default 'manual',
  created_at timestamptz not null default now()
);

-- 5. Histórico e Eventos da Venda (Auditoria)
create table if not exists public.sale_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'completed', 'canceled', 'refunded', 'returned', 'item_returned', 'note_added')),
  performed_by uuid references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 6. Devoluções de Vendas
create table if not exists public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  reason text not null,
  refund_amount numeric(12, 2) not null default 0.00,
  refund_status text not null default 'pending' check (refund_status in ('pending', 'completed', 'waived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 7. Itens Devolvidos
create table if not exists public.sale_return_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  return_id uuid not null references public.sale_returns(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id) on delete cascade,
  quantity numeric(12, 3) not null check (quantity > 0),
  restock boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. Tabela de Pedidos
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null,
  source text not null default 'pos' check (source in ('pos', 'online_store', 'whatsapp', 'manual')),
  status text not null default 'new' check (status in ('new', 'confirmed', 'preparing', 'ready', 'delivered', 'canceled')),
  subtotal_amount numeric(12, 2) not null default 0.00,
  discount_amount numeric(12, 2) not null default 0.00,
  total_amount numeric(12, 2) not null default 0.00,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, order_number)
);

-- 9. Itens de Pedidos
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  sku_snapshot text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
create index if not exists idx_customers_company on public.customers(company_id);
create index if not exists idx_customers_name on public.customers(company_id, name);
create index if not exists idx_sales_company on public.sales(company_id);
create index if not exists idx_sales_created_at on public.sales(company_id, created_at desc);
create index if not exists idx_sales_number on public.sales(company_id, sale_number);
create index if not exists idx_sales_status on public.sales(company_id, status);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);
create index if not exists idx_sale_payments_sale on public.sale_payments(sale_id);
create index if not exists idx_orders_company on public.orders(company_id);
create index if not exists idx_orders_created on public.orders(company_id, created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.sale_events enable row level security;
alter table public.sale_returns enable row level security;
alter table public.sale_return_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies para Customers
create policy "cust_select" on public.customers for select using (public.is_company_member(company_id));
create policy "cust_insert" on public.customers for insert with check (public.is_company_member(company_id));
create policy "cust_update" on public.customers for update using (public.is_company_member(company_id));
create policy "cust_delete" on public.customers for delete using (public.is_company_owner(company_id));

-- Policies para Sales e entidades filhas
create policy "sales_select" on public.sales for select using (public.is_company_member(company_id));
create policy "sales_insert" on public.sales for insert with check (public.is_company_member(company_id));
create policy "sales_update" on public.sales for update using (public.is_company_member(company_id));

create policy "sale_items_all" on public.sale_items for all using (public.is_company_member(company_id));
create policy "sale_payments_all" on public.sale_payments for all using (public.is_company_member(company_id));
create policy "sale_events_all" on public.sale_events for all using (public.is_company_member(company_id));
create policy "sale_returns_all" on public.sale_returns for all using (public.is_company_member(company_id));
create policy "sale_return_items_all" on public.sale_return_items for all using (public.is_company_member(company_id));

-- Policies para Orders
create policy "orders_select" on public.orders for select using (public.is_company_member(company_id));
create policy "orders_insert" on public.orders for insert with check (public.is_company_member(company_id));
create policy "orders_update" on public.orders for update using (public.is_company_member(company_id));
create policy "order_items_all" on public.order_items for all using (public.is_company_member(company_id));

-- ==============================================================================
-- FUNÇÃO TRANSACIONAL COMPLETA: PROCESSAR VENDA NO PDV (COM BAIXA DE ESTOQUE)
-- ==============================================================================
create or replace function public.process_pos_sale(
  p_company_id uuid,
  p_items jsonb,          -- Array: [{ product_id, variant_id, quantity, unit_price, discount_amount }]
  p_payments jsonb,       -- Array: [{ method, amount, installments, change_amount }]
  p_customer_id uuid default null,
  p_discount_amount numeric default 0.00,
  p_notes text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sale_id uuid;
  v_sale_number text;
  v_sale_count int;
  v_subtotal numeric(12, 2) := 0.00;
  v_total numeric(12, 2) := 0.00;
  v_item record;
  v_prod record;
  v_var record;
  v_payment record;
  v_qty numeric;
  v_unit_price numeric;
  v_item_discount numeric;
  v_line_total numeric;
  v_stock_movement_res json;
begin
  -- 1. Validar autorização
  if not public.is_company_member(p_company_id) then
    raise exception 'Acesso negado para esta empresa.';
  end if;

  -- 2. Idempotência (evitar vendas duplicadas por duplo clique)
  if p_idempotency_key is not null then
    select id, sale_number into v_sale_id, v_sale_number
    from public.sales
    where company_id = p_company_id and idempotency_key = p_idempotency_key;

    if v_sale_id is not null then
      return jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_sale_number,
        'idempotent', true
      );
    end if;
  end if;

  -- 3. Gerar número de venda sequencial para a empresa (ex: VD-0001)
  select coalesce(count(*), 0) + 1 into v_sale_count
  from public.sales
  where company_id = p_company_id;

  v_sale_number := 'VD-' || lpad(v_sale_count::text, 4, '0');

  -- 4. Inserir cabeçalho da venda temporariamente com total 0 para obter ID
  insert into public.sales (
    company_id,
    sale_number,
    customer_id,
    created_by,
    status,
    subtotal_amount,
    discount_amount,
    total_amount,
    payment_status,
    notes,
    idempotency_key,
    completed_at
  ) values (
    p_company_id,
    v_sale_number,
    p_customer_id,
    auth.uid(),
    'completed',
    0.00,
    coalesce(p_discount_amount, 0.00),
    0.00,
    'paid',
    p_notes,
    p_idempotency_key,
    now()
  ) returning id into v_sale_id;

  -- 5. Processar cada item da venda: validar preço, gravar snapshot e baixar estoque
  for v_item in select * from jsonb_to_recordset(p_items) as x(
    product_id uuid,
    variant_id uuid,
    quantity numeric,
    unit_price numeric,
    discount_amount numeric
  ) loop
    -- Obter produto com lock
    select * into v_prod from public.products
    where id = v_item.product_id and company_id = p_company_id;

    if v_prod.id is null then
      raise exception 'Produto não encontrado: %', v_item.product_id;
    end if;

    if not v_prod.is_active then
      raise exception 'Produto inativo não pode ser vendido: %', v_prod.name;
    end if;

    v_qty := coalesce(v_item.quantity, 1);
    if v_qty <= 0 then
      raise exception 'Quantidade inválida para o item: %', v_prod.name;
    end if;

    v_unit_price := coalesce(v_item.unit_price, v_prod.sale_price);
    v_item_discount := coalesce(v_item.discount_amount, 0.00);
    v_line_total := greatest(0.00, (v_qty * v_unit_price) - v_item_discount);
    v_subtotal := v_subtotal + (v_qty * v_unit_price);

    -- Variação se existir
    if v_item.variant_id is not null then
      select * into v_var from public.product_variants
      where id = v_item.variant_id and product_id = v_prod.id;

      insert into public.sale_items (
        company_id, sale_id, product_id, variant_id,
        product_name_snapshot, variant_name_snapshot, sku_snapshot,
        quantity, unit_price, discount_amount, line_total
      ) values (
        p_company_id, v_sale_id, v_prod.id, v_var.id,
        v_prod.name, v_var.combination_key, coalesce(v_var.sku, v_prod.sku),
        v_qty, v_unit_price, v_item_discount, v_line_total
      );

      -- Baixar estoque da variação se produto controlar estoque
      if v_prod.track_inventory then
        v_stock_movement_res := public.record_inventory_movement(
          p_company_id,
          v_prod.id,
          v_var.id,
          'sale',
          v_qty,
          'Venda PDV ' || v_sale_number,
          'Item: ' || v_prod.name || ' (' || v_var.combination_key || ')',
          v_sale_number || '_var_' || v_var.id
        );
      end if;
    else
      insert into public.sale_items (
        company_id, sale_id, product_id, variant_id,
        product_name_snapshot, variant_name_snapshot, sku_snapshot,
        quantity, unit_price, discount_amount, line_total
      ) values (
        p_company_id, v_sale_id, v_prod.id, null,
        v_prod.name, null, v_prod.sku,
        v_qty, v_unit_price, v_item_discount, v_line_total
      );

      -- Baixar estoque simples
      if v_prod.track_inventory then
        v_stock_movement_res := public.record_inventory_movement(
          p_company_id,
          v_prod.id,
          null,
          'sale',
          v_qty,
          'Venda PDV ' || v_sale_number,
          'Item: ' || v_prod.name,
          v_sale_number || '_prod_' || v_prod.id
        );
      end if;
    end if;
  end loop;

  -- 6. Calcular total final
  v_total := greatest(0.00, v_subtotal - coalesce(p_discount_amount, 0.00));

  update public.sales
  set subtotal_amount = v_subtotal,
      total_amount = v_total
  where id = v_sale_id;

  -- 7. Registrar pagamentos
  for v_payment in select * from jsonb_to_recordset(p_payments) as p(
    method text,
    amount numeric,
    installments int,
    change_amount numeric
  ) loop
    insert into public.sale_payments (
      company_id, sale_id, method, amount, installments, change_amount, confirmation_source
    ) values (
      p_company_id, v_sale_id, v_payment.method, v_payment.amount,
      coalesce(v_payment.installments, 1), coalesce(v_payment.change_amount, 0.00), 'manual'
    );
  end loop;

  -- 8. Registrar evento de auditoria
  insert into public.sale_events (
    company_id, sale_id, event_type, performed_by, metadata
  ) values (
    p_company_id, v_sale_id, 'completed', auth.uid(),
    jsonb_build_object('sale_number', v_sale_number, 'total', v_total)
  );

  return jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal', v_subtotal,
    'total', v_total
  );
end;
$$;

-- ==============================================================================
-- FUNÇÃO TRANSACIONAL: CANCELAR VENDA E REVERTER ESTOQUE
-- ==============================================================================
create or replace function public.cancel_sale(
  p_company_id uuid,
  p_sale_id uuid,
  p_reason text default 'Cancelamento pelo operador'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sale record;
  v_item record;
  v_prod record;
begin
  -- 1. Validar permissão
  if not public.is_company_member(p_company_id) then
    raise exception 'Acesso negado para esta empresa.';
  end if;

  -- 2. Obter venda
  select * into v_sale from public.sales
  where id = p_sale_id and company_id = p_company_id
  for update;

  if v_sale.id is null then
    raise exception 'Venda não encontrada.';
  end if;

  if v_sale.status = 'canceled' then
    raise exception 'Esta venda já está cancelada.';
  end if;

  -- 3. Atualizar status da venda
  update public.sales
  set status = 'canceled',
      canceled_at = now()
  where id = p_sale_id;

  -- 4. Reverter o estoque de cada item vendido
  for v_item in select * from public.sale_items where sale_id = p_sale_id loop
    select track_inventory into v_prod from public.products where id = v_item.product_id;

    if v_prod.track_inventory then
      perform public.record_inventory_movement(
        p_company_id,
        v_item.product_id,
        v_item.variant_id,
        'return',
        v_item.quantity,
        'Cancelamento de Venda ' || v_sale.sale_number,
        'Motivo: ' || coalesce(p_reason, 'Cancelada'),
        'cancel_' || v_sale.sale_number || '_' || v_item.id
      );
    end if;
  end loop;

  -- 5. Gravar evento de auditoria
  insert into public.sale_events (
    company_id, sale_id, event_type, performed_by, metadata
  ) values (
    p_company_id, p_sale_id, 'canceled', auth.uid(),
    jsonb_build_object('reason', p_reason, 'canceled_at', now())
  );

  return jsonb_build_object(
    'success', true,
    'sale_number', v_sale.sale_number,
    'status', 'canceled'
  );
end;
$$;
