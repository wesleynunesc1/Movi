import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Customer } from '@/types/sales';

const LOCAL_CUSTOMERS_KEY = 'movi_local_customers';

function getLocalCustomers(companyId: string): Customer[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    const list: Customer[] = raw ? JSON.parse(raw) : [];
    return list.filter((c) => c.company_id === companyId);
  } catch {
    return [];
  }
}

function saveLocalCustomers(companyId: string, customers: Customer[]): void {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    let all: Customer[] = raw ? JSON.parse(raw) : [];
    all = all.filter((c) => c.company_id !== companyId).concat(customers);
    localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar clientes locais:', e);
  }
}

export const customersService = {
  async list(companyId: string, search?: string): Promise<Customer[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('customers')
          .select('*')
          .eq('company_id', companyId)
          .order('name');

        if (search && search.trim()) {
          const s = search.trim();
          query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Erro ao consultar clientes no Supabase, usando local:', err);
      }
    }

    const localList = getLocalCustomers(companyId);
    if (!search || !search.trim()) return localList;
    const s = search.toLowerCase().trim();
    return localList.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
    );
  },

  async create(companyId: string, input: { name: string; phone?: string | null; email?: string | null; document?: string | null }): Promise<Customer> {
    const newCustomer: Customer = {
      id: 'cust_' + Math.random().toString(36).substring(2, 9),
      company_id: companyId,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      document: input.document?.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            company_id: companyId,
            name: newCustomer.name,
            phone: newCustomer.phone,
            email: newCustomer.email,
            document: newCustomer.document,
          })
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Erro ao criar cliente no Supabase, mantendo local:', err);
      }
    }

    const list = getLocalCustomers(companyId);
    list.unshift(newCustomer);
    saveLocalCustomers(companyId, list);
    return newCustomer;
  },
};
