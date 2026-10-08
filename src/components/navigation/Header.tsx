import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { MoviLogo } from '@/components/brand/MoviLogo';
import {
  Bell,
  Store,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

const ROUTE_TITLES: Record<string, { title: string; section: string }> = {
  '/app/dashboard': { title: 'Dashboard', section: 'Visão Geral' },
  '/app/pos': { title: 'Frente de Caixa (PDV)', section: 'Operações' },
  '/app/sales': { title: 'Vendas Realizadas', section: 'Operações' },
  '/app/orders': { title: 'Pedidos e Entregas', section: 'Operações' },
  '/app/products': { title: 'Catálogo de Produtos', section: 'Gestão' },
  '/app/inventory': { title: 'Controle de Estoque', section: 'Gestão' },
  '/app/customers': { title: 'Base de Clientes', section: 'Gestão' },
  '/app/finance': { title: 'Gestão Financeira', section: 'Inteligência' },
  '/app/reports': { title: 'Relatórios Gerenciais', section: 'Inteligência' },
  '/app/online-store': { title: 'Minha Loja Online', section: 'Canais' },
  '/app/settings': { title: 'Configurações da Empresa', section: 'Sistema' },
  '/app/help': { title: 'Central de Ajuda', section: 'Sistema' },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany, profile, user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const routeInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Painel MOVI',
    section: 'Sistema',
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Mobile Brand & Title / Desktop Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <MoviLogo variant="symbol" size="sm" />
        </div>

        <div className="flex flex-col">
          {/* Breadcrumb Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-secondary font-medium">
            <span>MOVI</span>
            <ChevronRight className="w-3 h-3 text-text-muted" />
            <span>{routeInfo.section}</span>
            <ChevronRight className="w-3 h-3 text-text-muted" />
            <span className="text-movi-graphite font-semibold">{routeInfo.title}</span>
          </div>
          {/* Main Title */}
          <h1 className="text-base sm:text-lg font-bold font-display text-movi-graphite leading-tight">
            {routeInfo.title}
          </h1>
        </div>
      </div>

      {/* Right Controls: Company badge, Notification, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Company Pill */}
        {currentCompany && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border/80">
            <Store className="w-3.5 h-3.5 text-movi-graphite" />
            <span className="text-xs font-semibold text-movi-graphite max-w-[140px] truncate">
              {currentCompany.name}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-movi-yellow text-movi-graphite">
              Free
            </span>
          </div>
        )}

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-text-secondary hover:text-movi-graphite hover:bg-surface-secondary transition-colors relative"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-movi-yellow ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-dropdown z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                <span className="text-xs font-bold font-display text-movi-graphite">
                  Notificações do Sistema
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-movi-yellow/30 text-movi-graphite font-semibold">
                  1 nova
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary/70 border border-border/60 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-movi-yellow shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-movi-graphite">Boas-vindas ao MOVI</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Sua conta Free Premium está ativa. Comece cadastrando sua primeira venda.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-secondary transition-colors"
            aria-label="Menu da conta"
          >
            <div className="w-8 h-8 rounded-full bg-movi-graphite text-white flex items-center justify-center font-bold text-xs shadow-subtle">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-movi-graphite leading-none">
                {profile?.full_name || 'Usuário'}
              </span>
              <span className="text-[10px] text-text-secondary mt-0.5">Proprietário</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-dropdown z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-bold text-movi-graphite truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
              </div>

              <Link
                to="/app/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-movi-graphite rounded-xl hover:bg-surface-secondary transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-text-secondary" />
                <span>Configurações da Conta</span>
              </Link>

              <Link
                to="/app/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-movi-graphite rounded-xl hover:bg-surface-secondary transition-colors"
              >
                <User className="w-3.5 h-3.5 text-text-secondary" />
                <span>Minha Empresa</span>
              </Link>

              <div className="border-t border-border/60 my-1" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-status-danger rounded-xl hover:bg-status-danger-bg transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
