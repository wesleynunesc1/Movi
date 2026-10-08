import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { CompanyWithDetails, Profile } from '@/types/database';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  companies: CompanyWithDetails[];
  currentCompany: CompanyWithDetails | null;
  switchCompany: (companyId: string) => void;
  refreshUserData: () => Promise<void>;
  updateCurrentCompanySettings: (settings: Partial<CompanyWithDetails['settings']>) => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createCompany: (data: {
    name: string;
    business_type?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    state?: string;
    primary_color?: string;
  }) => Promise<{ company: CompanyWithDetails | null; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local fallback keys for seamless preview when Supabase credentials aren't inserted yet
const LOCAL_AUTH_KEY = 'movi_local_auth_session';
const LOCAL_COMPANIES_KEY = 'movi_local_companies';
const LOCAL_ACTIVE_COMPANY_ID = 'movi_local_active_company_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [currentCompany, setCurrentCompany] = useState<CompanyWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to load profile and companies for a given user ID
  const fetchUserEntities = useCallback(async (userId: string, userMeta?: any) => {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else {
          // Fallback profile if trigger is processing
          setProfile({
            id: userId,
            user_id: userId,
            full_name: userMeta?.full_name || 'Empreendedor MOVI',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // 2. Fetch Companies with memberships & settings
        const { data: members } = await supabase
          .from('company_members')
          .select('company_id, role, status')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (members && members.length > 0) {
          const companyIds = members.map((m) => m.company_id);
          const { data: companiesData } = await supabase
            .from('companies')
            .select('*')
            .in('id', companyIds);

          const { data: settingsData } = await supabase
            .from('company_settings')
            .select('*')
            .in('company_id', companyIds);

          const fullCompanies: CompanyWithDetails[] = (companiesData || []).map((c) => {
            const memberInfo = members.find((m) => m.company_id === c.id);
            const setting = (settingsData || []).find((s) => s.company_id === c.id);
            return {
              ...c,
              role: memberInfo?.role || 'owner',
              settings: setting || {
                company_id: c.id,
                logo_url: null,
                primary_color: '#FFD600',
                phone: null,
                whatsapp: null,
                address: null,
                city: null,
                state: null,
                business_document: null,
                updated_at: new Date().toISOString(),
              },
            };
          });

          setCompanies(fullCompanies);
          const savedActiveId = localStorage.getItem(LOCAL_ACTIVE_COMPANY_ID);
          const active = fullCompanies.find((c) => c.id === savedActiveId) || fullCompanies[0];
          setCurrentCompany(active || null);
        } else {
          setCompanies([]);
          setCurrentCompany(null);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      }
    } else {
      // Local fallback mode
      const rawStoredCompanies = localStorage.getItem(LOCAL_COMPANIES_KEY);
      let parsedCompanies: CompanyWithDetails[] = [];
      if (rawStoredCompanies) {
        try {
          parsedCompanies = JSON.parse(rawStoredCompanies);
        } catch {
          parsedCompanies = [];
        }
      }

      setCompanies(parsedCompanies);
      const savedActiveId = localStorage.getItem(LOCAL_ACTIVE_COMPANY_ID);
      const active = parsedCompanies.find((c) => c.id === savedActiveId) || parsedCompanies[0] || null;
      setCurrentCompany(active);

      setProfile({
        id: userId,
        user_id: userId,
        full_name: userMeta?.full_name || 'Wesley Nunes',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }, []);

  // Initialize session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      if (isSupabaseConfigured && supabase) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (currentSession?.user) {
            setUser(currentSession.user);
            setSession(currentSession);
            await fetchUserEntities(currentSession.user.id, currentSession.user.user_metadata);
          } else {
            setUser(null);
            setSession(null);
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (!mounted) return;
            setSession(newSession);
            if (newSession?.user) {
              setUser(newSession.user);
              await fetchUserEntities(newSession.user.id, newSession.user.user_metadata);
            } else {
              setUser(null);
              setProfile(null);
              setCompanies([]);
              setCurrentCompany(null);
            }
          }
        );

        setIsLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Check local storage mock session
        const storedSession = localStorage.getItem(LOCAL_AUTH_KEY);
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            setUser(parsed.user);
            setSession(parsed.session);
            await fetchUserEntities(parsed.user.id, parsed.user.user_metadata);
          } catch {
            localStorage.removeItem(LOCAL_AUTH_KEY);
          }
        }
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUserEntities]);

  const switchCompany = useCallback(
    (companyId: string) => {
      const found = companies.find((c) => c.id === companyId);
      if (found) {
        setCurrentCompany(found);
        localStorage.setItem(LOCAL_ACTIVE_COMPANY_ID, companyId);
      }
    },
    [companies]
  );

  const refreshUserData = useCallback(async () => {
    if (user) {
      await fetchUserEntities(user.id, user.user_metadata);
    }
  }, [user, fetchUserEntities]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserEntities(data.user.id, data.user.user_metadata);
      }
      return { error: null };
    } else {
      // Local demo sign in
      const mockUser: any = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: email.split('@')[0].toUpperCase() },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      const mockSession: any = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        user: mockUser,
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: mockUser, session: mockSession }));
      setUser(mockUser);
      setSession(mockSession);
      await fetchUserEntities(mockUser.id, mockUser.user_metadata);
      setIsLoading(false);
      return { error: null };
    }
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      setIsLoading(false);
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserEntities(data.user.id, { full_name: fullName });
      }
      return { error: null };
    } else {
      const mockUser: any = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      const mockSession: any = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        user: mockUser,
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: mockUser, session: mockSession }));
      setUser(mockUser);
      setSession(mockSession);
      await fetchUserEntities(mockUser.id, mockUser.user_metadata);
      setIsLoading(false);
      return { error: null };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    localStorage.removeItem(LOCAL_ACTIVE_COMPANY_ID);
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompanies([]);
    setCurrentCompany(null);
    setIsLoading(false);
  };

  const createCompany = async (data: {
    name: string;
    business_type?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    state?: string;
    primary_color?: string;
  }) => {
    if (!user) {
      return { company: null, error: new Error('Usuário não autenticado. Faça login novamente.') };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Tentar executar a função atômica RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_company_atomic', {
          p_name: data.name,
          p_business_type: data.business_type || 'Geral',
          p_phone: data.phone || null,
          p_whatsapp: data.whatsapp || null,
          p_city: data.city || null,
          p_state: data.state || null,
          p_primary_color: data.primary_color || '#FFD600',
        });

        if (rpcError) {
          console.warn('RPC create_company_atomic falhou, executando inserção direta:', rpcError);
          // Inserção direta resiliente via tabelas
          const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 10000);
          const { data: comp, error: compErr } = await supabase
            .from('companies')
            .insert({
              name: data.name,
              slug,
              owner_user_id: user.id,
              business_type: data.business_type || 'Geral',
            })
            .select()
            .single();

          if (compErr) {
            console.error('Erro na criação de company:', compErr);
            return {
              company: null,
              error: new Error(
                compErr.message.includes('recursion')
                  ? 'Aviso do banco: execute o script 003_fix_rls_recursion.sql no Supabase SQL Editor para corrigir a permissão RLS.'
                  : compErr.message
              ),
            };
          }

          // Inserir membro proprietário
          await supabase.from('company_members').insert({
            company_id: comp.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
          });

          // Inserir configurações
          await supabase.from('company_settings').insert({
            company_id: comp.id,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            city: data.city || null,
            state: data.state || null,
            primary_color: data.primary_color || '#FFD600',
          });

          const directCompany: CompanyWithDetails = {
            ...comp,
            role: 'owner',
            settings: {
              company_id: comp.id,
              logo_url: null,
              primary_color: data.primary_color || '#FFD600',
              phone: data.phone || null,
              whatsapp: data.whatsapp || null,
              address: null,
              city: data.city || null,
              state: data.state || null,
              business_document: null,
              updated_at: new Date().toISOString(),
            },
          };

          setCompanies((prev) => [...prev.filter((c) => c.id !== directCompany.id), directCompany]);
          setCurrentCompany(directCompany);
          localStorage.setItem(LOCAL_ACTIVE_COMPANY_ID, directCompany.id);
          return { company: directCompany, error: null };
        }

        // RPC executado com sucesso
        const createdCompany: CompanyWithDetails = {
          id: rpcData.id,
          name: rpcData.name || data.name,
          slug: rpcData.slug,
          owner_user_id: user.id,
          business_type: data.business_type || 'Geral',
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'owner',
          settings: {
            company_id: rpcData.id,
            logo_url: null,
            primary_color: data.primary_color || '#FFD600',
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            address: null,
            city: data.city || null,
            state: data.state || null,
            business_document: null,
            updated_at: new Date().toISOString(),
          },
        };

        setCompanies((prev) => [...prev.filter((c) => c.id !== createdCompany.id), createdCompany]);
        setCurrentCompany(createdCompany);
        localStorage.setItem(LOCAL_ACTIVE_COMPANY_ID, createdCompany.id);
        return { company: createdCompany, error: null };
      } catch (err: any) {
        console.error('Exceção ao criar empresa:', err);
        return { company: null, error: err };
      }
    } else {
      // Local storage creation
      const newCompanyId = 'comp_' + Math.random().toString(36).substring(2, 9);
      const newComp: CompanyWithDetails = {
        id: newCompanyId,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        owner_user_id: user.id,
        business_type: data.business_type || 'Geral',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'owner',
        settings: {
          company_id: newCompanyId,
          logo_url: null,
          primary_color: data.primary_color || '#FFD600',
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          address: null,
          city: data.city || null,
          state: data.state || null,
          business_document: null,
          updated_at: new Date().toISOString(),
        },
      };

      const updated = [...companies, newComp];
      setCompanies(updated);
      setCurrentCompany(newComp);
      localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(updated));
      localStorage.setItem(LOCAL_ACTIVE_COMPANY_ID, newCompanyId);
      return { company: newComp, error: null };
    }
  };

  const updateCurrentCompanySettings = async (settings: Partial<CompanyWithDetails['settings']>) => {
    if (!currentCompany) return;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: currentCompany.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      await refreshUserData();
    } else {
      const updatedComp: CompanyWithDetails = {
        ...currentCompany,
        settings: {
          ...currentCompany.settings!,
          ...settings,
          company_id: currentCompany.id,
          updated_at: new Date().toISOString(),
        },
      };

      const updatedList = companies.map((c) => (c.id === currentCompany.id ? updatedComp : c));
      setCompanies(updatedList);
      setCurrentCompany(updatedComp);
      localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(updatedList));
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    if (!user || !profile) return;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;
      await refreshUserData();
    } else {
      const updatedProfile: Profile = {
        ...profile,
        ...data,
        updated_at: new Date().toISOString(),
      };
      setProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        companies,
        currentCompany,
        switchCompany,
        refreshUserData,
        updateCurrentCompanySettings,
        updateProfile,
        signIn,
        signUp,
        signOut,
        createCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
