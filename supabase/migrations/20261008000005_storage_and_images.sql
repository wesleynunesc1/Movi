-- ==============================================================================
-- MOVI — SUPABASE STORAGE & IMAGENS DE PRODUTOS
-- ==============================================================================

-- 1. Criação do Bucket de Imagens de Produtos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 2. Políticas de Segurança do Storage (RLS)
-- Permitir leitura pública para exibição no catálogo, PDV e loja online
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Permitir upload de imagens para usuários autenticados
create policy "product_images_auth_insert" on storage.objects
  for insert with check (bucket_id = 'product-images');

-- Permitir atualização de imagens
create policy "product_images_auth_update" on storage.objects
  for update using (bucket_id = 'product-images');

-- Permitir remoção de imagens
create policy "product_images_auth_delete" on storage.objects
  for delete using (bucket_id = 'product-images');
