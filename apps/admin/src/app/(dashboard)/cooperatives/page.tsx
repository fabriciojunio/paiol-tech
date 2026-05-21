'use client';

import { useEffect, useState } from 'react';

interface Cooperative {
  id: string;
  name: string;
  cnpj: string;
  plan: string | null;
  maxAssociates: number | null;
  monthlyPrice: number | null;
  active: boolean;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const DEMO_COOPERATIVES: Cooperative[] = [
  { id: '1', name: 'Cooperativa Agro Mato Verde', cnpj: '45.678.901/0001-33', plan: 'premium', maxAssociates: 500, monthlyPrice: 2990, active: true, createdAt: '2023-11-20' },
  { id: '2', name: 'Coop. Produtores do Cerrado', cnpj: '23.456.789/0001-44', plan: 'professional', maxAssociates: 200, monthlyPrice: 1490, active: true, createdAt: '2024-01-08' },
  { id: '3', name: 'Cooperativa Raizes do Campo', cnpj: '67.890.123/0001-55', plan: 'basic', maxAssociates: 50, monthlyPrice: 490, active: true, createdAt: '2024-03-15' },
  { id: '4', name: 'Agrocoop Centro-Oeste Ltda', cnpj: '12.345.678/0001-66', plan: 'professional', maxAssociates: 150, monthlyPrice: 1490, active: false, createdAt: '2023-09-01' },
];

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('admin_token') === 'demo-token';
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CooperativesPage() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (isDemo()) {
      setCooperatives(DEMO_COOPERATIVES);
      setTotal(DEMO_COOPERATIVES.length);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`${API_URL}/admin/cooperatives?page=${page}&limit=${limit}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d: { data: Cooperative[]; total: number }) => {
        setCooperatives(d.data ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>🤝 Cooperativas</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} cooperativas cadastradas</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
        ) : cooperatives.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Nenhuma cooperativa cadastrada ainda.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Plano</th>
                <th>Máx. Associados</th>
                <th>Status</th>
                <th>Criada em</th>
              </tr>
            </thead>
            <tbody>
              {cooperatives.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: '#6b7280', fontFamily: 'monospace' }}>{c.cnpj}</td>
                  <td>{c.plan ?? '—'}</td>
                  <td>{c.maxAssociates ?? '—'}</td>
                  <td>
                    <span className={`badge ${c.active ? 'badge-green' : 'badge-gray'}`}>
                      {c.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#6b7280' }}>Página {page}</span>
          <button className="btn-ghost" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Próxima →</button>
        </div>
      )}
    </div>
  );
}
