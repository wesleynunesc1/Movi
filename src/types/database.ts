export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier';
export type MemberStatus = 'active' | 'invited' | 'suspended';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  business_type: string;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  created_at: string;
}

export interface CompanySettings {
  company_id: string;
  logo_url: string | null;
  primary_color: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  business_document: string | null;
  updated_at: string;
}

export interface CompanyWithDetails extends Company {
  role?: UserRole;
  settings?: CompanySettings;
}

export interface PlanLimits {
  planName: string;
  badge: string;
  maxCompanies: number;
  maxProducts: number;
  maxCustomers: number;
  maxOwners: number;
  features: string[];
}

export const FREE_PREMIUM_PLAN: PlanLimits = {
  planName: 'MOVI Free',
  badge: 'Free Premium',
  maxCompanies: 1,
  maxProducts: 200,
  maxCustomers: 200,
  maxOwners: 1,
  features: [
    'Dashboard Comercial',
    'Frente de Caixa (PDV)',
    'Controle de Estoque',
    'Histórico de Vendas',
    'Financeiro Básico',
    'Catálogo Online Básico',
  ],
};
