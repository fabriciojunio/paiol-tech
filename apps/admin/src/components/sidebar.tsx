'use client';

import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { label: '🌾 Dashboard', href: '/' },
  { label: '👨‍🌾 Produtores', href: '/producers' },
  { label: '🤝 Cooperativas', href: '/cooperatives' },
  { label: '📊 Dívidas', href: '/debts' },
  { label: '📋 Audit Logs', href: '/audit' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#1f2937', color: '#f9fafb',
      display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #374151' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#3d6b2e' }}>🌾 Paiol Admin</h1>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Painel Administrativo</p>
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'block', padding: '10px 20px', fontSize: 14,
              background: pathname === item.href ? '#374151' : 'transparent',
              color: pathname === item.href ? '#fff' : '#d1d5db',
              borderLeft: pathname === item.href ? '3px solid #3d6b2e' : '3px solid transparent',
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <button
        onClick={logout}
        style={{ margin: '0 20px', background: '#374151', color: '#9ca3af', padding: '8px 0', borderRadius: 6, fontSize: 13 }}
      >
        Sair
      </button>
    </aside>
  );
}
