import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Menu,
} from 'lucide-react';
import { MobileMenuDrawer } from './MobileMenuDrawer';

export const MobileBottomNav: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainNav = [
    { label: 'Início', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Vender', path: '/app/pos', icon: ShoppingCart },
    { label: 'Produtos', path: '/app/products', icon: Package },
    { label: 'Pedidos', path: '/app/orders', icon: ClipboardList },
  ];

  return (
    <>
      <nav
        aria-label="Navegação mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-30 flex items-center justify-around px-2 shadow-card"
      >
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-movi-graphite font-bold scale-105'
                    : 'text-text-secondary hover:text-movi-graphite'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-movi-yellow text-movi-graphite shadow-subtle' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Botão de Menu para abrir gaveta */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center w-14 py-1 text-text-secondary hover:text-movi-graphite transition-colors"
          aria-label="Abrir menu de módulos"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Menu</span>
        </button>
      </nav>

      {/* Drawer com todos os módulos */}
      <MobileMenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
