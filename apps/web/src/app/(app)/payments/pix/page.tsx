'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Copy, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent } from '@paiol/ui';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { AppShell } from '@/components/app-shell';
import { useToast } from '@/components/toast-provider';

interface PixResult {
  paymentId: string;
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: string;
}

function PixPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const debtId = searchParams.get('debtId') ?? '';
  const amount = Number(searchParams.get('amount') ?? '0');
  const creditor = searchParams.get('creditor') ?? '';

  const [pix, setPix] = useState<PixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!debtId || !amount) {
      setError('Parâmetros inválidos. Volte e tente novamente.');
      return;
    }

    setIsLoading(true);
    apiClient
      .post<PixResult>('/payments/pix', {
        debtId,
        amount,
        description: `Pagamento dívida — ${creditor}`,
      })
      .then(setPix)
      .catch((err) => {
        const msg = err instanceof ApiClientError ? err.message : 'Erro ao gerar PIX';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [debtId, amount, creditor]);

  const copyCode = async () => {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    toast({ title: 'Código PIX copiado!', variant: 'success' });
    setTimeout(() => setCopied(false), 3000);
  };

  const expiresAt = pix ? new Date(pix.expiresAt) : null;
  const minutesLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000)) : 0;

  return (
    <AppShell title="Pagar com PIX" showBack>
      <div className="space-y-4 max-w-md mx-auto">
        {/* Resumo */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pagando dívida</p>
            <p className="font-semibold text-lg mt-1">{creditor}</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Gerando QR Code PIX...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {pix && (
          <>
            {/* QR Code */}
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-4">Escaneie o QR Code com o app do banco</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pix.qrCodeUrl}
                  alt="QR Code PIX"
                  className="mx-auto w-48 h-48 rounded-lg border"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />

                {expiresAt && (
                  <div className="flex items-center justify-center gap-1 mt-4 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expira em {minutesLeft} minuto{minutesLeft !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Código Copia e Cola */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">PIX Copia e Cola</p>
                <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all text-muted-foreground mb-3 max-h-24 overflow-y-auto">
                  {pix.qrCode}
                </div>
                <Button
                  className="w-full"
                  onClick={() => void copyCode()}
                  variant={copied ? 'outline' : 'default'}
                >
                  {copied ? (
                    <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Copiado!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Copiar código PIX</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground px-4">
              Após o pagamento, a dívida será marcada como paga automaticamente.
              ID da transação: <span className="font-mono">{pix.paymentId.slice(0, 16)}…</span>
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function PixPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <PixPageContent />
    </Suspense>
  );
}
