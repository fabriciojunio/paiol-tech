'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@paiol/ui';
import { sendOtpSchema, verifyOtpSchema } from '@paiol/validators';
import { maskPhone, normalizePhone } from '@paiol/utils';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import type { SendOtpResponse } from '@paiol/types';

type Step = 'phone' | 'otp';

const ERROR_MESSAGES: Record<string, string> = {
  OTP_INVALID: 'Código incorreto ou expirado. Tente novamente.',
  OTP_MAX_ATTEMPTS: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  VALIDATION_ERROR: 'Número de celular inválido.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhone(e.target.value));
    setError('');
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
      sendOtpSchema.parse({ phone: normalizedPhone });
    } catch {
      setError('Número de celular inválido. Ex: (11) 99999-9999');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post<SendOtpResponse>('/auth/otp/send', { phone: normalizedPhone });
      setExpiresAt(Date.now() + res.expiresIn * 1000);
      setStep('otp');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(ERROR_MESSAGES[err.code] ?? 'Algo deu errado. Tente novamente em instantes.');
      } else {
        setError('Algo deu errado. Tente novamente em instantes.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 3) otpRefs[index + 1]?.current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 4) { setError('Digite os 4 dígitos do código.'); return; }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
      verifyOtpSchema.parse({ phone: normalizedPhone, code });
    } catch {
      setError('Código inválido.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/otp/verify', { phone: normalizedPhone, code });
      await refresh();
      const redirect = searchParams.get('redirect') ?? '/';
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(ERROR_MESSAGES[err.code] ?? 'Algo deu errado. Tente novamente.');
      } else {
        setError('Algo deu errado. Tente novamente.');
      }
      setOtp(['', '', '', '']);
      otpRefs[0]?.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const minutesLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step === 'phone' ? 'Entrar no Paiol' : 'Digite o código'}
        </CardTitle>
        <CardDescription>
          {step === 'phone'
            ? 'Vamos te enviar um código no WhatsApp'
            : `Enviamos um código de 4 dígitos para ${phone}${minutesLeft > 0 ? ` — vale por ${minutesLeft} min` : ''}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Seu celular</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                autoComplete="tel"
                autoFocus
                className="text-lg h-12"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" loading={isLoading}>
              Receber código no WhatsApp
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label>Código de 4 dígitos</Label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-primary focus:outline-none"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" loading={isLoading}>
              Entrar
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setStep('phone'); setOtp(['', '', '', '']); setError(''); }}
            >
              Usar outro número
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-paiol-green to-paiol-green-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">🌾 Paiol</h1>
          <p className="text-green-100 mt-2 text-sm">Tudo que você deve, na palma da mão.</p>
        </div>
        <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
