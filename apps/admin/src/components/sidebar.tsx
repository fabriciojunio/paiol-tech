'use client';

import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { label: 'Dashboard', icon: '🌾', href: '/' },
  { label: 'Produtores', icon: '👨‍🌾', href: '/producers' },
  { label: 'Cooperativas', icon: '🤝', href: '/cooperatives' },
  { label: 'Dívidas', icon: '📊', href: '/debts' },
  { label: 'Audit Logs', icon: '📋', href: '/audit' },
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
      width: 240, minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a2f0f 0%, #1f3a14 100%)',
      color: '#f9fafb',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌾</div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#86efac' }}>Paiol Admin</h1>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Painel Administrativo</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8, marginBottom: 2,
                fontSize: 14, fontWeight: active ? 600 : 400,
                background: active ? 'rgba(134,239,172,0.12)' : 'transparent',
                color: active ? '#86efac' : 'rgba(255,255,255,0.65)',
                transition: 'all 0.15s',
                textDecoration: 'none',
                border: active ? '1px solid rgba(134,239,172,0.2)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={logout}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)', padding: '9px 0', borderRadius: 8,
            fontSize: 13, border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}
