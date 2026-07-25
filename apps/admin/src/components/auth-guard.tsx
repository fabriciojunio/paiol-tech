'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const demoAllowed = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const isValid = token && (token !== 'demo-token' || demoAllowed);
    if (!isValid && pathname !== '/login') {
      localStorage.removeItem('admin_token');
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked && pathname !== '/login') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#6b7280' }}>Verificando autenticação...</div>;
  }

  return <>{children}</>;
}
