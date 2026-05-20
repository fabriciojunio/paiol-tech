'use client';

import { useEffect, useState } from 'react';
import type { Producer } from '@paiol/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function ProducersPage() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    setIsLoading(true);
    fetch(`${API_URL}/admin/producers?page=${page}&limit=20`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => { const data = d as { data: Producer[]; total: number }; setProducers(data.data); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [page]);

  const pageCount = Math.ceil(total / 20);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>👨‍🌾 Produtores</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} produtores cadastrados</p>
      </div>

      {isLoading ? (
        <p style={{ color: '#6b7280' }}>Carregando...</p>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Telefone</th><th>Nome</th><th>Plano</th><th>CPF/CNPJ</th><th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {producers.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.phone}</td>
                  <td>{p.name ?? '—'}</td>
                  <td>
                    <span className={`badge ${p.plan === 'basic' ? 'badge-yellow' : 'badge-green'}`}>{p.plan}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{p.cpfCnpj ?? '—'}</td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {pageCount > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</button>
              <span style={{ padding: '8px 16px', color: '#6b7280' }}>Página {page} de {pageCount}</span>
              <button className="btn-ghost" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Próxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
