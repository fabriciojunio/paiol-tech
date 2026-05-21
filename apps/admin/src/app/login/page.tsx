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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1a3a0f 0%, #2d5c1a 50%, #3d6b2e 100%)',
    }}>
      {/* Left branding panel */}
      <div style={{
        display: 'none',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        color: '#fff',
      }} className="admin-left-panel">
        <div style={{ fontSize: 64, marginBottom: 24 }}>🌾</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Paiol Tech</h1>
        <p style={{ fontSize: 18, opacity: 0.8, margin: 0, textAlign: 'center', maxWidth: 280 }}>
          Gestão agrícola inteligente para cooperativas e produtores
        </p>
        <div style={{
          marginTop: 48,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '20px 28px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.7, textAlign: 'center' }}>
            Painel administrativo restrito
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
        background: '#fff',
        margin: '0 auto',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌾</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a3a0f', margin: '0 0 4px' }}>
              Paiol Admin
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Painel administrativo da plataforma
            </p>
          </div>

          {/* Demo credentials */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 28,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#166534', margin: '0 0 6px' }}>
              Credenciais de demonstração
            </p>
            <p style={{ fontSize: 12, color: '#15803d', margin: '0 0 2px', fontFamily: 'monospace' }}>
              Usuário: <strong>admin</strong>
            </p>
            <p style={{ fontSize: 12, color: '#15803d', margin: 0, fontFamily: 'monospace' }}>
              Senha: <strong>admin1234</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Senha
              </label>
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
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: '#b91c1c',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 8 }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Demo button */}
          <button
            type="button"
            onClick={handleDemo}
            style={{
              width: '100%',
              padding: '12px 0',
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
            <span>Acessar como demonstração</span>
          </button>
        </div>
      </div>
    </div>
  );
}
