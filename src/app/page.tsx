'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/shared/stores/useAppStore';

export default function RootPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push(user?.role === 'SUPERADMIN' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return null;
}
