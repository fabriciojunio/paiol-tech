'use client';

import { useEffect, useState } from 'react';

interface Debt {
  id: string;
  producerId: string;
  creditor: string;
  amount: number;
  dueDate: string;
  status: string;
  source: string;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const DEMO_DEBTS: Debt[] = [
  { id: '1', producerId: '1', creditor: 'Banco do Brasil S.A.', amount: 38500, dueDate: '2024-06-15', status: 'PENDING', source: 'Open Finance', createdAt: '2024-04-10' },
  { id: '2', producerId: '3', creditor: 'Sicoob Credicer', amount: 12750, dueDate: '2024-05-30', status: 'OVERDUE', source: 'Manual', createdAt: '2024-03-01' },
  { id: '3', producerId: '2', creditor: 'Bradesco Agro', amount: 89200, dueDate: '2024-07-01', status: 'PENDING', source: 'Open Finance', createdAt: '2024-04-20' },
  { id: '4', producerId: '5', creditor: 'Sicredi Centro-Oeste', amount: 5430, dueDate: '2024-04-28', status: 'PAID', source: 'Manual', createdAt: '2024-02-15' },
  { id: '5', producerId: '1', creditor: 'Caixa Rural', amount: 22000, dueDate: '2024-08-10', status: 'PENDING', source: 'Open Finance', createdAt: '2024-05-02' },
  { id: '6', producerId: '7', creditor: 'Banco do Nordeste', amount: 67800, dueDate: '2024-03-15', status: 'OVERDUE', source: 'Open Finance', createdAt: '2024-01-20' },
  { id: '7', producerId: '4', creditor: 'Santander Agro', amount: 15000, dueDate: '2024-06-01', status: 'CANCELLED', source: 'Manual', createdAt: '2024-04-05' },
];

function isDemo() {
  return typeof window !== 'undefined' && localStorage.getItem('admin_token') === 'demo-token';
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-yellow',
  PAID: 'badge-green',
  OVERDUE: 'badge-danger',
  CANCELLED: 'badge-gray',
};

export default function AdminDebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (isDemo()) {
      setDebts(DEMO_DEBTS);
      setTotal(DEMO_DEBTS.length);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`${API_URL}/admin/debts?page=${page}&limit=${limit}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d: { data: Debt[]; total: number }) => {
        setDebts(d.data ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>📊 Dívidas</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} dívidas no total</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
        ) : debts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Nenhuma dívida cadastrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Credor</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Fonte</th>
                <th>Criada em</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.creditor}</td>
                  <td>R$ {Number(d.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{new Date(d.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[d.status] ?? 'badge-gray'}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{d.source}</td>
                  <td style={{ color: '#6b7280' }}>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</td>
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
