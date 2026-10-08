import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { ProductCategory } from '@/types/products';

const LOCAL_CATEGORIES_KEY = 'movi_local_categories';

function getLocalCategories(companyId: string): ProductCategory[] {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    const list: ProductCategory[] = raw ? JSON.parse(raw) : [];
    return list.filter((c) => c.company_id === companyId);
  } catch {
    return [];
  }
}

function saveLocalCategory(cat: ProductCategory): void {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    const list: ProductCategory[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      list[idx] = cat;
    } else {
      list.push(cat);
    }
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar categoria localmente:', e);
  }
}

export const categoriesService = {
  async list(companyId: string): Promise<ProductCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) {
        console.warn('Fallback para categorias locais:', error);
        return getLocalCategories(companyId);
      }
      return data || [];
    }
    return getLocalCategories(companyId);
  },

  async create(companyId: string, name: string): Promise<ProductCategory> {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          company_id: companyId,
          name,
          slug,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.warn('Erro ao criar categoria no Supabase, usando local:', error);
      } else if (data) {
        return data;
      }
    }

    const localCat: ProductCategory = {
      id: 'cat_' + Math.random().toString(36).substring(2, 9),
      company_id: companyId,
      name,
      slug,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalCategory(localCat);
    return localCat;
  },

  async update(id: string, name: string, isActive = true): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('product_categories')
        .update({ name, is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.warn('Erro ao atualizar categoria:', error);
    }
    // Update local copy
    try {
      const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      const list: ProductCategory[] = raw ? JSON.parse(raw) : [];
      const item = list.find((c) => c.id === id);
      if (item) {
        item.name = name;
        item.is_active = isActive;
        item.updated_at = new Date().toISOString();
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(list));
      }
    } catch {}
  },
};
