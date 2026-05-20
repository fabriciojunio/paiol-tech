'use client';

import { useState, useEffect } from 'react';
import { Building2, CheckCircle, RefreshCw, Unplug } from 'lucide-react';
import { Button, Card, CardContent } from '@paiol/ui';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { AppShell } from '@/components/app-shell';
import { useToast } from '@/components/toast-provider';
import type { OpenFinanceConnection, Bank } from '@paiol/types';

interface ConnectionsData {
  connections: OpenFinanceConnection[];
  availableBanks: Bank[];
}

export default function OpenFinancePage() {
  const { toast } = useToast();
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    apiClient
      .get<ConnectionsData>('/open-finance/connections')
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const connect = async (bankCode: string) => {
    setConnecting(bankCode);
    try {
      await apiClient.post('/open-finance/connect', { bankCode });
      toast({ title: 'Banco conectado com sucesso!', variant: 'success' });
      load();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Erro ao conectar banco';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setConnecting(null);
    }
  };

  const sync = async (connectionId: string, bankCode: string) => {
    setSyncing(connectionId);
    try {
      const result = await apiClient.post<{ imported: number; skipped: number }>(`/open-finance/sync/${connectionId}`, { bankCode });
      toast({ title: `Sync concluído: ${result.imported} dívidas importadas`, variant: 'success' });
      load();
    } catch {
      toast({ title: 'Erro ao sincronizar', variant: 'destructive' });
    } finally {
      setSyncing(null);
    }
  };

  const connectedCodes = new Set(data?.connections.filter((c) => c.status === 'ACTIVE').map((c) => c.bankCode));

  return (
    <AppShell title="Open Finance" showBack>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p>Conecte sua conta bancária para importar automaticamente suas dívidas rurais cadastradas nos bancos participantes.</p>
          </CardContent>
        </Card>

        {data?.connections && data.connections.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Bancos conectados</h2>
            <div className="space-y-2">
              {data.connections.map((conn) => (
                <Card key={conn.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{conn.bankName}</p>
                      {conn.lastSyncAt && (
                        <p className="text-xs text-muted-foreground">
                          Última sync: {new Date(conn.lastSyncAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void sync(conn.id, conn.bankCode)}
                      disabled={syncing === conn.id}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncing === conn.id ? 'animate-spin' : ''}`} />
                      Sync
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
