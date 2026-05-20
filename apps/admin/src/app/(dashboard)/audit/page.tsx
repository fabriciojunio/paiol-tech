'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  producerId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ACTION_BADGE: Record<string, string> = {
  DATA_EXPORT: 'badge-yellow',
  ACCOUNT_DELETED: 'badge-danger',
  OPEN_FINANCE_SYNC: 'badge-green',
  OPEN_FINANCE_CONNECT: 'badge-green',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_URL}/admin/audit?page=${page}&limit=${limit}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d: { data: AuditLog[]; total: number }) => {
        setLogs(d.data ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>📋 Audit Logs</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} registros de auditoria (LGPD)</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Nenhum log de auditoria encontrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ação</th>
                <th>Recurso</th>
                <th>Produtor</th>
                <th>IP</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`badge ${ACTION_BADGE[log.action] ?? 'badge-gray'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: '#374151' }}>{log.resource}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ''}</td>
                  <td style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>
                    {log.producerId ? log.producerId.slice(0, 8) + '…' : '—'}
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{log.ip ?? '—'}</td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
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
