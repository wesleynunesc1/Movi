import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { MoviLogo } from '@/components/brand/MoviLogo';
import {
  X,
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
  Store,
  Sparkles,
} from 'lucide-react';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentCompany, companies, switchCompany, signOut, profile, user } = useAuth();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'OPERAÇÕES & GESTÃO',
      items: [
        { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
        { label: 'Frente de Caixa (PDV)', path: '/app/pos', icon: ShoppingCart },
        { label: 'Vendas', path: '/app/sales', icon: Receipt },
        { label: 'Pedidos', path: '/app/orders', icon: Package },
        { label: 'Produtos', path: '/app/products', icon: Package },
        { label: 'Estoque', path: '/app/inventory', icon: Boxes },
        { label: 'Clientes', path: '/app/customers', icon: Users },
      ],
    },
    {
      title: 'INTELIGÊNCIA & CANAIS',
      items: [
        { label: 'Financeiro', path: '/app/finance', icon: CircleDollarSign },
        { label: 'Relatórios', path: '/app/reports', icon: BarChart3 },
        { label: 'Minha Loja Online', path: '/app/online-store', icon: Globe },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { label: 'Configurações', path: '/app/settings', icon: Settings },
        { label: 'Ajuda & Suporte', path: '/app/help', icon: HelpCircle },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-movi-graphite/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-surface shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <MoviLogo variant="horizontal" theme="graphite" size="sm" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-movi-graphite hover:bg-surface-secondary"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Switcher Mobile */}
        <div className="p-4 border-b border-border bg-surface-secondary/50">
          <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">
            Empresa Ativa
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-border">
            <div className="w-8 h-8 rounded-lg bg-movi-yellow text-movi-graphite font-bold flex items-center justify-center text-xs shrink-0">
              {currentCompany?.name.charAt(0) || 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-movi-graphite block truncate">
                {currentCompany?.name}
              </span>
              <span className="text-[10px] text-text-secondary block">
                {currentCompany?.business_type} &bull; Free Premium
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h6 className="text-[10px] font-bold text-text-secondary tracking-wider uppercase px-2">
                {group.title}
              </h6>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-movi-yellow text-movi-graphite'
                          : 'text-movi-graphite hover:bg-surface-secondary'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-border bg-surface-secondary/40 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-movi-graphite text-white flex items-center justify-center font-bold text-xs">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-movi-graphite truncate">
                {profile?.full_name || 'Usuário MOVI'}
              </p>
              <p className="text-[10px] text-text-secondary truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-status-danger bg-status-danger-bg rounded-xl border border-status-danger-border transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
