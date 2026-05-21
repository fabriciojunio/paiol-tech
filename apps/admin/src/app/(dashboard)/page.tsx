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
    <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: '#111' }}>{value}</p>
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
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#3d6b2e' }}>🌾 Paiol Tech — Admin</h1>
      <p style={{ color: '#6b7280', marginBottom: isDemo ? 12 : 32 }}>Visão geral da plataforma</p>
      {isDemo && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 16px', marginBottom: 24, fontSize: 13, color: '#166534' }}>
          Modo demonstração — dados simulados. Backend não está conectado.
        </div>
      )}

      {isLoading ? (
        <p style={{ color: '#6b7280' }}>Carregando...</p>
      ) : stats !== null ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {card('Total de produtores', stats.totalProducers)}
          {card('Produtores ativos', stats.activeProducers)}
          {card('Total de dívidas', stats.totalDebts)}
          {card('Total em aberto', `R$ ${stats.totalOwed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
          {Object.entries(stats.plansBreakdown).map(([plan, count]) =>
            card(`Plano ${plan}`, count),
          )}
        </div>
      ) : (
        <p style={{ color: '#ef4444' }}>Não foi possível carregar os dados. Verifique a autenticação.</p>
      )}

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Navegação</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '👨‍🌾 Produtores', href: '/producers' },
            { label: '🏦 Cooperativas', href: '/cooperatives' },
            { label: '📊 Dívidas', href: '/debts' },
            { label: '📋 Audit Logs', href: '/audit' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{ padding: '10px 20px', background: '#3d6b2e', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
