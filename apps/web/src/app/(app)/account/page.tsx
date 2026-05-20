'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Download, Trash2, User, Building2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@paiol/ui';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/toast-provider';

export default function AccountPage() {
  const { producer, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await apiClient.get<object>('/producers/me/data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados-paiol.json';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Dados exportados com sucesso!', variant: 'success' });
    } catch {
      toast({ title: 'Erro ao exportar dados.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza? Esta ação é irreversível e apagará todos os seus dados.')) return;
    setIsDeleting(true);
    try {
      await apiClient.delete('/producers/me');
      toast({ title: 'Conta excluída.', description: 'Seus dados foram removidos.' });
      router.replace('/login');
    } catch {
      toast({ title: 'Erro ao excluir conta.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell title="Minha Conta">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-mono">{producer?.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plano</span>
              <span className="capitalize">{producer?.plan ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Open Finance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/open-finance" className="block">
              <Button variant="outline" className="w-full justify-start">
                Conectar conta bancária
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacidade (LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => void handleExportData()}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar meus dados'}
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Excluindo...' : 'Excluir minha conta'}
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </AppShell>
  );
}
