'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, CheckCircle, Clock, ExternalLink, RefreshCw, Unplug } from 'lucide-react';
import { Button, Card, CardContent } from '@paiol/ui';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { AppShell } from '@/components/app-shell';
import { useToast } from '@/components/toast-provider';
import type { OpenFinanceConnection, Bank } from '@paiol/types';

interface ConnectionsData {
  connections: OpenFinanceConnection[];
  availableBanks: Bank[];
}

interface ConnectResult {
  connectionId: string;
  status: 'ACTIVE' | 'PENDING_AUTHORIZATION';
  authorizationUrl?: string;
}

export default function OpenFinancePage() {
  const { toast } = useToast();
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    apiClient
      .get<ConnectionsData>('/open-finance/connections')
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(load, [load]);

  const showError = (err: unknown, fallback: string) => {
    if (err instanceof ApiClientError && err.code === 'PREMIUM_FEATURE') {
      toast({ title: err.message, variant: 'destructive' });
      return;
    }
    const msg = err instanceof ApiClientError ? err.message : fallback;
    toast({ title: msg, variant: 'destructive' });
  };

  const connect = async (bankCode: string) => {
    setConnecting(bankCode);
    try {
      const result = await apiClient.post<ConnectResult>('/open-finance/connect', { bankCode });
      if (result.status === 'PENDING_AUTHORIZATION' && result.authorizationUrl) {
        setAuthUrl(result.authorizationUrl);
        toast({ title: 'Falta autorizar no banco. Toque no botão para concluir.', variant: 'default' });
      } else {
        toast({ title: 'Banco conectado!', variant: 'success' });
      }
      load();
    } catch (err) {
      showError(err, 'Não deu para conectar o banco. Tente de novo.');
    } finally {
      setConnecting(null);
    }
  };

  const sync = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      const result = await apiClient.post<{ imported: number; skipped: number }>(
        `/open-finance/sync/${connectionId}`,
        {},
      );
      const title =
        result.imported > 0
          ? `${result.imported} dívida${result.imported > 1 ? 's' : ''} trazida${result.imported > 1 ? 's' : ''} do banco`
          : 'Tudo em dia: nenhuma dívida nova no banco';
      toast({ title, variant: 'success' });
      load();
    } catch (err) {
      showError(err, 'Não deu para buscar as dívidas agora. Tente de novo.');
    } finally {
      setSyncing(null);
    }
  };

  const revoke = async (connectionId: string, bankName: string) => {
    if (!window.confirm(`Desconectar ${bankName}? As dívidas já trazidas continuam no app.`)) return;
    setRevoking(connectionId);
    try {
      await apiClient.delete(`/open-finance/connections/${connectionId}`);
      toast({ title: 'Banco desconectado', variant: 'success' });
      load();
    } catch (err) {
      showError(err, 'Não deu para desconectar. Tente de novo.');
    } finally {
      setRevoking(null);
    }
  };

  const visibleConnections = data?.connections.filter((c) => c.status !== 'REVOKED') ?? [];
  const connectedCodes = new Set(visibleConnections.map((c) => c.bankCode));

  return (
    <AppShell title="Conectar bancos" showBack>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
            <p>
              Conecte seu banco e o Paiol busca sozinho as suas dívidas rurais: financiamento,
              custeio, Pronaf. Sem digitar nada.
            </p>
            <p className="text-xs">
              De graça durante o lançamento. Você pode desconectar quando quiser, e o banco não
              fica sabendo de nada que você faz aqui.
            </p>
          </CardContent>
        </Card>

        {authUrl && (
          <Card className="border-primary/40">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium">Falta um passo: autorizar no banco</p>
              <p className="text-sm text-muted-foreground">
                Por segurança, o próprio banco pede a sua confirmação antes de liberar os dados.
              </p>
              <a href={authUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="mt-1">
                  <ExternalLink className="h-4 w-4 mr-2" /> Autorizar no banco
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        {visibleConnections.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Bancos conectados</h2>
            <div className="space-y-2">
              {visibleConnections.map((conn) => (
                <Card key={conn.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    {conn.status === 'PENDING_AUTHORIZATION' ? (
                      <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{conn.bankName}</p>
                      {conn.status === 'PENDING_AUTHORIZATION' ? (
                        <p className="text-xs text-yellow-700">Esperando você autorizar no banco</p>
                      ) : conn.lastSyncAt ? (
                        <p className="text-xs text-muted-foreground">
                          Última busca: {new Date(conn.lastSyncAt).toLocaleDateString('pt-BR')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ainda sem busca</p>
                      )}
                    </div>
                    {conn.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void sync(conn.id)}
                        disabled={syncing === conn.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncing === conn.id ? 'animate-spin' : ''}`} />
                        Buscar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void revoke(conn.id, conn.bankName)}
                      disabled={revoking === conn.id}
                      aria-label={`Desconectar ${conn.bankName}`}
                    >
                      <Unplug className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-semibold mb-3">Bancos disponíveis</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.availableBanks.filter((b) => !connectedCodes.has(b.code)).map((bank) => (
                <Card key={bank.code}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <p className="flex-1 font-medium">{bank.name}</p>
                    <Button
                      size="sm"
                      onClick={() => void connect(bank.code)}
                      disabled={connecting === bank.code}
                    >
                      {connecting === bank.code ? 'Conectando...' : 'Conectar'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {connectedCodes.size === data?.availableBanks.length && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Unplug className="h-4 w-4" /> Todos os bancos disponíveis estão conectados
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
