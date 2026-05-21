'use client';

import { useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemo = useCallback(() => {
    localStorage.setItem('admin_token', 'demo-token');
    router.push('/');
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError('Usuário ou senha incorretos.');
        return;
      }
      const { token } = await res.json() as { token: string };
      localStorage.setItem('admin_token', token);
      router.push('/');
    } catch {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#3d6b2e', marginBottom: 8 }}>🌾 Paiol Admin</h1>
        <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>Acesso restrito a administradores</p>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 6, margin: '0 0 6px 0' }}>Credenciais de demonstração</p>
          <p style={{ fontSize: 12, color: '#15803d', margin: '0 0 3px 0', fontFamily: 'monospace' }}>Usuário: <strong>admin</strong></p>
          <p style={{ fontSize: 12, color: '#15803d', margin: 0, fontFamily: 'monospace' }}>Senha: <strong>admin1234</strong></p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '10px 0', fontSize: 15 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Quer explorar sem credenciais?</p>
          <button
            type="button"
            onClick={handleDemo}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 14,
              fontWeight: 600,
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>👤</span>
            <span>Entrar como demonstração</span>
          </button>
        </div>
      </div>
    </div>
  );
}
