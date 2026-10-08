import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { MoviLogo } from '@/components/brand/MoviLogo';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Users,
  CircleDollarSign,
  BarChart3,
  Globe,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavSection {
  title: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'VISÃO GERAL',
    items: [
      { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'OPERAÇÕES',
    items: [
      { name: 'Frente de Caixa', path: '/app/pos', icon: ShoppingCart },
      { name: 'Vendas', path: '/app/sales', icon: Receipt },
      { name: 'Pedidos', path: '/app/orders', icon: Package },
    ],
  },
  {
    title: 'GESTÃO',
    items: [
      { name: 'Produtos', path: '/app/products', icon: Package },
      { name: 'Estoque', path: '/app/inventory', icon: Boxes },
      { name: 'Clientes', path: '/app/customers', icon: Users },
    ],
  },
  {
    title: 'INTELIGÊNCIA',
    items: [
      { name: 'Financeiro', path: '/app/finance', icon: CircleDollarSign },
      { name: 'Relatórios', path: '/app/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'CANAIS',
    items: [
      { name: 'Minha Loja Online', path: '/app/online-store', icon: Globe },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { name: 'Configurações', path: '/app/settings', icon: Settings },
      { name: 'Ajuda', path: '/app/help', icon: HelpCircle },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const { currentCompany, companies, switchCompany, signOut, profile, user } = useAuth();
  const [showCompanySelect, setShowCompanySelect] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      className={`hidden lg:flex flex-col bg-movi-graphite border-r border-movi-graphite-border transition-all duration-300 select-none z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header com Marca e Botão de Recolher */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-movi-graphite-border/70">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <MoviLogo variant="horizontal" theme="white" size="md" />
          </div>
        ) : (
          <div className="mx-auto">
            <MoviLogo variant="symbol" theme="white" size="sm" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-movi-graphite-hover transition-colors"
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Seletor de Empresa Ativa */}
      <div className="p-3 border-b border-movi-graphite-border/50">
        {!collapsed ? (
          <div className="relative">
            <button
              onClick={() => setShowCompanySelect(!showCompanySelect)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-movi-graphite-hover/80 border border-movi-graphite-border hover:border-gray-600 transition-all text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-movi-yellow text-movi-graphite flex items-center justify-center font-bold text-xs shrink-0">
                  {currentCompany?.name?.charAt(0) || 'M'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {currentCompany?.name || 'Selecionar Empresa'}
                  </h4>
                  <span className="text-[10px] text-gray-400 block truncate">
                    {currentCompany?.business_type || 'Plano Free'}
                  </span>
                </div>
              </div>
            </button>

            {/* Dropdown de Empresas */}
            {showCompanySelect && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-secondary border border-border rounded-xl shadow-dropdown z-50 p-1.5">
                <div className="text-[10px] uppercase font-semibold text-text-secondary px-2 py-1">
                  Minhas Empresas
                </div>
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      switchCompany(c.id);
                      setShowCompanySelect(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      c.id === currentCompany?.id
                        ? 'bg-movi-yellow text-movi-graphite font-bold'
                        : 'text-movi-graphite hover:bg-white'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tooltip content={currentCompany?.name || 'Empresa Ativa'} position="right">
            <div className="w-10 h-10 mx-auto rounded-xl bg-movi-yellow text-movi-graphite flex items-center justify-center font-bold text-sm cursor-pointer shadow-subtle">
              {currentCompany?.name?.charAt(0) || 'M'}
            </div>
          </Tooltip>
        )}
      </div>

      {/* Menu de Navegação em Categorias */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h5 className="px-3 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                {section.title}
              </h5>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;

              const navLink = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-movi-yellow text-movi-graphite font-bold shadow-subtle'
                        : 'text-gray-300 hover:text-white hover:bg-movi-graphite-hover'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-movi-graphite' : 'text-gray-400'}`} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </>
                  )}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.path} content={item.name} position="right">
                  {navLink}
                </Tooltip>
              ) : (
                navLink
              );
            })}
          </div>
        ))}
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-movi-graphite-border/70 space-y-2">
        {/* Identificação do Plano Free Premium */}
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-movi-graphite-hover/70 border border-movi-graphite-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-movi-yellow" />
              <div>
                <span className="text-[11px] font-bold text-white block">MOVI Free</span>
                <span className="text-[9px] text-gray-400">Até 200 produtos</span>
              </div>
            </div>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-movi-yellow text-movi-graphite">
              Premium
            </span>
          </div>
        ) : (
          <Tooltip content="Plano MOVI Free Premium" position="right">
            <div className="w-10 h-10 mx-auto rounded-xl bg-movi-graphite-hover flex items-center justify-center text-movi-yellow cursor-default">
              <Sparkles className="w-4 h-4" />
            </div>
          </Tooltip>
        )}

        {/* Perfil & Sair */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} pt-1`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-secondary border border-gray-600 flex items-center justify-center font-bold text-xs text-movi-graphite shrink-0">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white block truncate">
                  {profile?.full_name || 'Usuário MOVI'}
                </span>
                <span className="text-[10px] text-gray-400 block truncate">
                  {user?.email || 'proprietario@movi.com'}
                </span>
              </div>
            </div>
          ) : (
            <Tooltip content={profile?.full_name || 'Meu Perfil'} position="right">
              <div className="w-8 h-8 rounded-full bg-surface-secondary border border-gray-600 flex items-center justify-center font-bold text-xs text-movi-graphite">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            </Tooltip>
          )}

          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-gray-400 hover:text-status-danger hover:bg-movi-graphite-hover transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
