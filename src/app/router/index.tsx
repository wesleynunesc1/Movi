import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { AppLayout } from '@/app/layouts/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import {
  POSPage,
  SalesPage,
  OrdersPage,
  CustomersPage,
  FinancePage,
  ReportsPage,
  OnlineStorePage,
  HelpPage,
} from '@/features/modules/FutureModules';
import { Button } from '@/components/ui/Button';

export const router = createBrowserRouter([
  // Raiz: Redireciona para o app
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },

  // Rotas Públicas de Autenticação
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Onboarding da Empresa
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },

  // Espaço Autenticado da Aplicação
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'pos',
        element: <POSPage />,
      },
      {
        path: 'sales',
        element: <SalesPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'finance',
        element: <FinancePage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'online-store',
        element: <OnlineStorePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpPage />,
      },
    ],
  },

  // Rota 404 Página não encontrada
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-bg-main p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="text-4xl font-extrabold font-display text-movi-graphite">404</div>
          <h2 className="text-lg font-bold text-movi-graphite">Página não encontrada</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            O endereço acessado não existe ou foi movido na plataforma MOVI.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={() => window.location.assign('/app/dashboard')}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    ),
  },
]);
