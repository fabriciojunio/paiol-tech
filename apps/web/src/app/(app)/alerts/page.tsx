'use client';

import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@paiol/ui';
import { formatDateBR } from '@paiol/utils';
import { apiClient } from '@/lib/api-client';
import { AppShell } from '@/components/app-shell';
import type { Alert } from '@paiol/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Alert[]>('/alerts')
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const sentAlerts = alerts.filter((a) => a.status === 'SENT');
  const pendingAlerts = alerts.filter((a) => a.status === 'PENDING');

  return (
    <AppShell title="Avisos">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Você recebe um aviso no WhatsApp antes do vencimento de cada dívida.</p>
            <p>O padrão é 3 dias antes, mas você pode alterar em cada dívida.</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <>
            {pendingAlerts.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">Próximos avisos</h2>
                <div className="space-y-2">
                  {pendingAlerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Bell className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">
                            Aviso {alert.daysBefore} dia{alert.daysBefore !== 1 ? 's' : ''} antes
                          </p>
                          <Badge variant="warning" className="text-xs mt-1">Pendente</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {sentAlerts.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">Avisos enviados</h2>
                <div className="space-y-2">
                  {sentAlerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">Aviso enviado pelo WhatsApp</p>
                          {alert.sentAt && (
                            <p className="text-xs text-muted-foreground">{formatDateBR(alert.sentAt)}</p>
                          )}
                          <Badge variant="success" className="text-xs mt-1">Enviado</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {alerts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum aviso configurado ainda.
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
