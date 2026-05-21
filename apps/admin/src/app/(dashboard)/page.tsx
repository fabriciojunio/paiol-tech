'use client';

import { useEffect, useState, useMemo } from 'react';

interface Stats {
  totalProducers: number;
  activeProducers: number;
  totalDebts: number;
  totalOwed: number;
  plansBreakdown: Record<string, number>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const DEMO_STATS: Stats = {
  totalProducers: 312,
  activeProducers: 287,
  totalDebts: 1048,
  totalOwed: 4250000,
  plansBreakdown: { basico: 198, padrao: 87, premium: 27 },
};

function card(label: string, value: string | number) {
  return (
    <div key={label} className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const isTokenDemo = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_token') === 'demo-token';
  }, []);

  useEffect(() => {
    if (isTokenDemo) {
      setStats(DEMO_STATS);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    fetch(`${API_URL}/admin/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setStats(d as Stats))
      .catch(() => {
        setStats(DEMO_STATS);
        setIsDemo(true);
      })
      .finally(() => setIsLoading(false));
  }, [isTokenDemo]);

  return (
    <div>
      <div className="page-header">
        <h1>🌾 Paiol Tech — Painel Administrativo</h1>
        <p>Visão geral da plataforma</p>
      </div>

      {isDemo && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 18px', marginBottom: 28, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✅</span>
          <span><strong>Modo demonstração</strong> — dados simulados. Backend não está conectado.</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ height: 88, background: '#e5e7eb', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : stats !== null ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            {card('Total de Produtores', stats.totalProducers)}
            {card('Produtores Ativos', stats.activeProducers)}
            {card('Total de Dívidas', stats.totalDebts)}
            {card('Total em Aberto', `R$ ${stats.totalOwed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Distribuição por Plano</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {Object.entries(stats.plansBreakdown).map(([plan, count]) =>
                card(`Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`, count),
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#b91c1c', fontSize: 14 }}>
          Não foi possível carregar os dados. Verifique a autenticação.
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Acesso Rápido</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: '👨‍🌾 Produtores', href: '/producers', desc: 'Gerenciar cadastros' },
            { label: '🤝 Cooperativas', href: '/cooperatives', desc: 'Ver cooperativas' },
            { label: '📊 Dívidas', href: '/debts', desc: 'Acompanhar dívidas' },
            { label: '📋 Audit Logs', href: '/audit', desc: 'Histórico de ações' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{ display: 'block', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', transition: 'all 0.15s', textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.label.split(' ')[0]}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{item.label.split(' ').slice(1).join(' ')}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
