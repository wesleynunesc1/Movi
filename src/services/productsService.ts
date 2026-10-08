import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Product, ProductImage, ProductVariant } from '@/types/products';
import { inventoryService } from './inventoryService';

const LOCAL_PRODUCTS_KEY = 'movi_local_products';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  stockStatus?: 'normal' | 'low_stock' | 'out_of_stock' | 'untracked';
  sortBy?: 'name' | 'sale_price' | 'quantity' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  totalActive: number;
  totalUnitsInStock: number;
  lowStockCount: number;
  outOfStockCount: number;
}

function getLocalProducts(companyId: string): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    const list: Product[] = raw ? JSON.parse(raw) : [];
    return list.filter((p) => p.company_id === companyId && !p.archived_at);
  } catch {
    return [];
  }
}

function saveLocalProducts(companyId: string, products: Product[]): void {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    let all: Product[] = raw ? JSON.parse(raw) : [];
    all = all.filter((p) => p.company_id !== companyId).concat(products);
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar produtos locais:', e);
  }
}

export const productsService = {
  async list(companyId: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('products')
          .select('*, category:product_categories(*), images:product_images(*), variants:product_variants(*), inventory:inventory_items(*)', { count: 'exact' })
          .eq('company_id', companyId)
          .is('archived_at', null);

        if (filters.search) {
          const s = filters.search.trim();
          query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%,barcode.ilike.%${s}%`);
        }

        if (filters.categoryId) {
          query = query.eq('category_id', filters.categoryId);
        }

        if (filters.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }

        const { data, count, error } = await query;

        if (!error && data) {
          // Flatten inventory info onto products
          const mapped: Product[] = data.map((item: any) => {
            const mainInv = (item.inventory || []).find((inv: any) => !inv.variant_id);
            const variantInvs = (item.inventory || []).filter((inv: any) => Boolean(inv.variant_id));
            
            // If has variants, total stock is sum of variants
            let totalQty = item.has_variants && variantInvs.length > 0
              ? variantInvs.reduce((acc: number, curr: any) => acc + (Number(curr.quantity_on_hand) || 0), 0)
              : (Number(mainInv?.quantity_on_hand) || 0);

            let minQty = item.has_variants && variantInvs.length > 0
              ? variantInvs.reduce((acc: number, curr: any) => acc + (Number(curr.minimum_quantity) || 0), 0)
              : (Number(mainInv?.minimum_quantity) || 0);

            return {
              ...item,
              quantity_on_hand: totalQty,
              minimum_quantity: minQty,
            };
          });

          return this.computeMetricsAndPaginate(mapped, filters);
        }
      } catch (err) {
        console.warn('Erro ao consultar produtos no Supabase, usando local:', err);
      }
    }

    // Local fallback
    const localList = getLocalProducts(companyId);
    return this.computeMetricsAndPaginate(localList, filters);
  },

  computeMetricsAndPaginate(allProducts: Product[], filters: ProductFilters): ProductsResponse {
    let filtered = [...allProducts];

    // Compute global metrics on active products
    const activeProducts = filtered.filter((p) => p.is_active);
    const totalActive = activeProducts.length;

    let totalUnitsInStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    allProducts.forEach((p) => {
      if (!p.track_inventory) return;
      const q = p.quantity_on_hand || 0;
      const min = p.minimum_quantity || 0;
      totalUnitsInStock += q;
      if (q <= 0) {
        outOfStockCount++;
      } else if (q <= min) {
        lowStockCount++;
      }
    });

    // Apply search
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    // Apply category
    if (filters.categoryId) {
      filtered = filtered.filter((p) => p.category_id === filters.categoryId);
    }

    // Apply active status
    if (filters.isActive !== undefined) {
      filtered = filtered.filter((p) => p.is_active === filters.isActive);
    }

    // Apply stock status
    if (filters.stockStatus) {
      filtered = filtered.filter((p) => {
        if (!p.track_inventory) return filters.stockStatus === 'untracked';
        const q = p.quantity_on_hand || 0;
        const min = p.minimum_quantity || 0;
        if (filters.stockStatus === 'out_of_stock') return q <= 0;
        if (filters.stockStatus === 'low_stock') return q > 0 && q <= min;
        if (filters.stockStatus === 'normal') return q > min;
        return true;
      });
    }

    // Sorting
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof Product] ?? '';
      let valB: any = b[sortBy as keyof Product] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 15;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      products: paginated,
      total,
      totalActive,
      totalUnitsInStock,
      lowStockCount,
      outOfStockCount,
    };
  },

  async uploadImageToStorage(companyId: string, productId: string, base64OrUrl: string, index: number): Promise<string> {
    if (!isSupabaseConfigured || !supabase) return base64OrUrl;

    // Se já for uma URL externa ou URL pública do Supabase, retorna direto
    if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
      return base64OrUrl;
    }

    // Se for data URL base64, tentar converter e subir no bucket do Supabase Storage
    if (base64OrUrl.startsWith('data:image/')) {
      try {
        const match = base64OrUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (match) {
          const rawExt = match[1];
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
          const base64Data = match[2];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: `image/${rawExt}` });

          const fileName = `${Date.now()}_${index}.${ext}`;
          const filePath = `${companyId}/${productId}/${fileName}`;

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, blob, {
              contentType: `image/${rawExt}`,
              upsert: true,
            });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              return publicUrlData.publicUrl;
            }
          } else if (error) {
            console.warn('Erro ao subir para o Supabase Storage (usando fallback data-uri):', error.message);
          }
        }
      } catch (err) {
        console.warn('Falha no upload para Storage, utilizando base64 como fallback:', err);
      }
    }

    return base64OrUrl;
  },

  async create(companyId: string, payload: Partial<Product> & { initialStock?: number; initialMinStock?: number }): Promise<Product> {
    const list = getLocalProducts(companyId);
    if (list.length >= 200) {
      throw new Error('Limite do plano Free atingido (máximo de 200 produtos).');
    }

    const productId = 'prod_' + Math.random().toString(36).substring(2, 9);
    const newProduct: Product = {
      id: productId,
      company_id: companyId,
      category_id: payload.category_id || null,
      name: payload.name || 'Novo Produto',
      description: payload.description || null,
      brand: payload.brand || null,
      sku: payload.sku || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: payload.barcode || null,
      unit: payload.unit || 'UN',
      cost_price: Number(payload.cost_price) || 0,
      sale_price: Number(payload.sale_price) || 0,
      promotional_price: payload.promotional_price ? Number(payload.promotional_price) : null,
      track_inventory: payload.track_inventory ?? true,
      has_variants: Boolean(payload.has_variants),
      is_active: payload.is_active ?? true,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: payload.images || [],
      variants: payload.variants || [],
      quantity_on_hand: Number(payload.initialStock) || 0,
      minimum_quantity: Number(payload.initialMinStock) || 0,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbProd, error } = await supabase
          .from('products')
          .insert({
            company_id: companyId,
            category_id: newProduct.category_id,
            name: newProduct.name,
            description: newProduct.description,
            brand: newProduct.brand,
            sku: newProduct.sku,
            barcode: newProduct.barcode,
            unit: newProduct.unit,
            cost_price: newProduct.cost_price,
            sale_price: newProduct.sale_price,
            promotional_price: newProduct.promotional_price,
            track_inventory: newProduct.track_inventory,
            has_variants: newProduct.has_variants,
            is_active: newProduct.is_active,
          })
          .select()
          .single();

        if (!error && dbProd) {
          newProduct.id = dbProd.id;

          // 1. Inserir imagens no banco (tabela product_images) e no Supabase Storage
          if (payload.images && payload.images.length > 0) {
            const imagesToInsert = [];
            for (let i = 0; i < payload.images.length; i++) {
              const img = payload.images[i];
              const uploadedPath = await this.uploadImageToStorage(companyId, dbProd.id, img.storage_path, i);
              imagesToInsert.push({
                company_id: companyId,
                product_id: dbProd.id,
                storage_path: uploadedPath,
                sort_order: i,
                is_primary: Boolean(img.is_primary ?? i === 0),
              });
            }

            const { data: dbImgs, error: imgError } = await supabase
              .from('product_images')
              .insert(imagesToInsert)
              .select();

            if (!imgError && dbImgs) {
              newProduct.images = dbImgs;
            } else if (imgError) {
              console.error('Erro ao salvar imagens no banco Supabase:', imgError);
            }
          }

          // 2. Inserir variantes no banco (tabela product_variants)
          if (payload.has_variants && payload.variants && payload.variants.length > 0) {
            const variantsData = payload.variants.map((v) => ({
              company_id: companyId,
              product_id: dbProd.id,
              sku: v.sku,
              barcode: v.barcode || null,
              combination_key: v.combination_key,
              cost_price_override: v.cost_price_override ? Number(v.cost_price_override) : null,
              sale_price_override: v.sale_price_override ? Number(v.sale_price_override) : null,
              is_active: v.is_active ?? true,
            }));

            const { data: insertedVars } = await supabase
              .from('product_variants')
              .insert(variantsData)
              .select();

            if (insertedVars) {
              newProduct.variants = insertedVars;
              for (const iv of insertedVars) {
                const origVar = payload.variants.find((v) => v.combination_key === iv.combination_key);
                if (origVar && (origVar.quantity_on_hand || origVar.minimum_quantity)) {
                  await inventoryService.recordMovement({
                    company_id: companyId,
                    product_id: dbProd.id,
                    variant_id: iv.id,
                    movement_type: 'initial',
                    quantity: Number(origVar.quantity_on_hand) || 0,
                    reason: 'Estoque inicial da variação',
                    minimum_quantity: Number(origVar.minimum_quantity) || 0,
                  });
                }
              }
            }
          }

          // 3. Registrar movimentação de estoque inicial se tracking habilitado em item simples
          if (!payload.has_variants && newProduct.track_inventory && (payload.initialStock || payload.initialMinStock)) {
            await inventoryService.recordMovement({
              company_id: companyId,
              product_id: dbProd.id,
              movement_type: 'initial',
              quantity: Number(payload.initialStock) || 0,
              reason: 'Estoque inicial de implantação',
              minimum_quantity: Number(payload.initialMinStock) || 0,
            });
          }
        }
      } catch (e) {
        console.warn('Erro ao salvar no Supabase, mantendo local:', e);
      }
    }

    // Save to local persistence
    list.unshift(newProduct);
    saveLocalProducts(companyId, list);

    // Also register local inventory movement
    if (!payload.has_variants && newProduct.track_inventory && (payload.initialStock || payload.initialMinStock)) {
      await inventoryService.recordMovement({
        company_id: companyId,
        product_id: newProduct.id,
        movement_type: 'initial',
        quantity: Number(payload.initialStock) || 0,
        reason: 'Estoque inicial de implantação',
        minimum_quantity: Number(payload.initialMinStock) || 0,
      });
    }

    return newProduct;
  },

  async update(id: string, companyId: string, payload: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .update({
            category_id: payload.category_id,
            name: payload.name,
            description: payload.description,
            brand: payload.brand,
            sku: payload.sku,
            barcode: payload.barcode,
            unit: payload.unit,
            cost_price: payload.cost_price,
            sale_price: payload.sale_price,
            promotional_price: payload.promotional_price,
            track_inventory: payload.track_inventory,
            has_variants: payload.has_variants,
            is_active: payload.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        // Sincronizar imagens no Supabase (tabela product_images)
        if (payload.images !== undefined) {
          await supabase.from('product_images').delete().eq('product_id', id);

          if (payload.images.length > 0) {
            const imagesToInsert = [];
            for (let i = 0; i < payload.images.length; i++) {
              const img = payload.images[i];
              const uploadedPath = await this.uploadImageToStorage(companyId, id, img.storage_path, i);
              imagesToInsert.push({
                company_id: companyId,
                product_id: id,
                storage_path: uploadedPath,
                sort_order: i,
                is_primary: Boolean(img.is_primary ?? i === 0),
              });
            }

            const { data: dbImgs, error: imgErr } = await supabase
              .from('product_images')
              .insert(imagesToInsert)
              .select();

            if (!imgErr && dbImgs) {
              payload.images = dbImgs;
            }
          }
        }

        // Sincronizar variantes no Supabase (tabela product_variants)
        if (payload.has_variants && payload.variants !== undefined) {
          await supabase.from('product_variants').delete().eq('product_id', id);
          if (payload.variants.length > 0) {
            const variantsData = payload.variants.map((v) => ({
              company_id: companyId,
              product_id: id,
              sku: v.sku,
              barcode: v.barcode || null,
              combination_key: v.combination_key,
              cost_price_override: v.cost_price_override ? Number(v.cost_price_override) : null,
              sale_price_override: v.sale_price_override ? Number(v.sale_price_override) : null,
              is_active: v.is_active ?? true,
            }));
            await supabase.from('product_variants').insert(variantsData);
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar produto no Supabase:', e);
      }
    }

    const list = getLocalProducts(companyId);
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payload, updated_at: new Date().toISOString() };
      saveLocalProducts(companyId, list);
      return list[idx];
    }
    return payload as Product;
  },

  async duplicate(id: string, companyId: string): Promise<Product> {
    const list = getLocalProducts(companyId);
    const original = list.find((p) => p.id === id);
    if (!original) throw new Error('Produto não encontrado');

    const copyPayload: any = {
      ...original,
      name: `${original.name} (Cópia)`,
      sku: `${original.sku}-COP${Math.floor(100 + Math.random() * 900)}`,
      barcode: null,
      initialStock: 0,
      initialMinStock: original.minimum_quantity || 0,
    };
    delete copyPayload.id;

    return this.create(companyId, copyPayload);
  },

  async toggleActive(id: string, companyId: string, isActive: boolean): Promise<Product> {
    return this.update(id, companyId, { is_active: isActive });
  },

  async archive(id: string, companyId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .update({ archived_at: new Date().toISOString(), is_active: false })
          .eq('id', id);
      } catch (e) {
        console.warn('Erro ao arquivar no Supabase:', e);
      }
    }

    const list = getLocalProducts(companyId);
    const p = list.find((item) => item.id === id);
    if (p) {
      p.archived_at = new Date().toISOString();
      p.is_active = false;
      saveLocalProducts(companyId, list);
    }
  },

  async bulkUpdate(ids: string[], companyId: string, action: 'activate' | 'deactivate' | 'archive' | 'change_category', value?: any): Promise<void> {
    const list = getLocalProducts(companyId);
    ids.forEach((id) => {
      const item = list.find((p) => p.id === id);
      if (!item) return;
      if (action === 'activate') item.is_active = true;
      if (action === 'deactivate') item.is_active = false;
      if (action === 'archive') {
        item.archived_at = new Date().toISOString();
        item.is_active = false;
      }
      if (action === 'change_category') item.category_id = value;
    });
    saveLocalProducts(companyId, list);

    if (isSupabaseConfigured && supabase) {
      try {
        if (action === 'activate') await supabase.from('products').update({ is_active: true }).in('id', ids);
        if (action === 'deactivate') await supabase.from('products').update({ is_active: false }).in('id', ids);
        if (action === 'archive') await supabase.from('products').update({ archived_at: new Date().toISOString(), is_active: false }).in('id', ids);
        if (action === 'change_category') await supabase.from('products').update({ category_id: value }).in('id', ids);
      } catch (e) {
        console.warn('Erro em atualização em massa no Supabase:', e);
      }
    }
  },

  async bulkUpdateStatus(companyId: string, ids: string[], isActive: boolean): Promise<void> {
    return this.bulkUpdate(ids, companyId, isActive ? 'activate' : 'deactivate');
  },

  async bulkUpdateCategory(companyId: string, ids: string[], categoryId: string): Promise<void> {
    return this.bulkUpdate(ids, companyId, 'change_category', categoryId);
  },

  async bulkArchive(companyId: string, ids: string[]): Promise<void> {
    return this.bulkUpdate(ids, companyId, 'archive');
  },
};
