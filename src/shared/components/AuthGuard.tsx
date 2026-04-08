'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/shared/stores/useAppStore';

const PUBLIC_ROUTES = ['/login'];

// Map routes to required permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'view_dashboard',
  '/employees': 'crud_employee',
  '/departments': 'crud_department',
  '/kpi-template': 'crud_template',
  '/evaluation': 'eval_kpi',
  '/evaluation-history': 'eval_kpi',
  '/salary': 'approve_salary',
  '/accounts': 'manage_users',
  '/permissions': 'manage_settings',
  '/period-config': 'manage_period',
  '/admin': '__superadmin__', // Special: role check instead of permission
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, loadFromBackend, user, hasPermission, permissions } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login');
    } else if (isAuthenticated && PUBLIC_ROUTES.includes(pathname)) {
      router.push(user?.role === 'SUPERADMIN' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, pathname, router, mounted]);

  // Permission-based route protection
  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;
    
    // If we're still loading permissions for a non-SuperAdmin, wait
    if (loading && permissions.length === 0 && user.role !== 'SUPERADMIN') return;

    const requiredPerm = ROUTE_PERMISSIONS[pathname];
    if (!requiredPerm) return; // No permission needed (e.g. /, unknown routes)

    if (requiredPerm === '__superadmin__') {
      // Admin page requires SUPERADMIN role
      if (user.role !== 'SUPERADMIN') {
        router.push('/dashboard');
      }
    } else {
      // Check permission via store
      if (!hasPermission(requiredPerm)) {
        router.push('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, user, pathname, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && user?.tenantId) {
      loadFromBackend(user.tenantId);
    }
  }, [isAuthenticated, user?.tenantId, loadFromBackend]);

  if (!mounted) return null;

  // Show nothing if checking auth and not on a public route
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
