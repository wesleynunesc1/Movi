import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/navigation/Header';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { Skeleton } from '@/components/ui/Skeleton';

export const AppLayout: React.FC = () => {
  const { user, currentCompany, isLoading } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('movi_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('movi_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-movi-yellow animate-pulse" />
          </div>
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-48 w-full mt-6" />
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Onboarding Guard: If no company exists, redirect to onboarding
  if (!currentCompany && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-bg-main flex text-text-primary">
      {/* Sidebar Desktop */}
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Fixed Bottom Navigation for Mobile */}
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
