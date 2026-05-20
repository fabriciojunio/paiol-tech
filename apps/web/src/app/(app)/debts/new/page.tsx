'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Button, Input, Label, Card, CardContent } from '@paiol/ui';
import { COMMON_CREDITORS } from '@paiol/utils';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useToast } from '@/components/toast-provider';
import { AppShell } from '@/components/app-shell';
import { VoiceInput } from '@/components/voice-input';
import { OcrInput } from '@/components/ocr-input';
import type { CreateDebtDto, PossibleDuplicate } from '@paiol/types';
import { Mic, Camera, AlertTriangle } from 'lucide-react';

const fuse = new Fuse(COMMON_CREDITORS as unknown as string[], { threshold: 0.4 });

interface ParsedDebt {
  creditor: string;
  amount: string;
  dueDate: string;
  description: string;
}

export default function NewDebtPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<ParsedDebt>({ creditor: '', amount: '', dueDate: '', description: '' });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ParsedDebt>>({});
  const [duplicate, setDuplicate] = useState<PossibleDuplicate | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const handleCreditorChange = (value: string) => {
    setForm((f) => ({ ...f, creditor: value }));
    if (value.length >= 2) {
      const results = fuse.search(value).slice(0, 4).map((r) => r.item);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleVoiceResult = (parsed: Partial<ParsedDebt>) => {
    setForm((f) => ({ ...f, ...parsed }));
    setShowVoice(false);
  };

  const handleOcrResult = (parsed: Partial<ParsedDebt>) => {
    setForm((f) => ({ ...f, ...parsed }));
    setShowOcr(false);
  };

  const validate = (): boolean => {
    const errs: Partial<ParsedDebt> = {};
    if (!form.creditor.trim()) errs.creditor = 'Nome do credor é obrigatório';
    const amt = parseFloat(form.amount.replace(',', '.'));
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Valor deve ser maior que zero';
    if (!form.dueDate) errs.dueDate = 'Data de vencimento é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (force = false) => {
    if (!validate()) return;

    const body: CreateDebtDto = {
      creditor: form.creditor.trim(),
      amount: parseFloat(form.amount.replace(',', '.')),
      dueDate: form.dueDate,
      source: 'MANUAL',
      ...(form.description ? { description: form.description } : {}),
    };

    if (!force && duplicate) {
      setDuplicate(null);
    }

    setIsLoading(true);
    try {
      const dto = force ? { ...body, forceDuplicate: true } : body;
      await apiClient.post('/debts', dto);
      toast({ title: 'Dívida adicionada!', variant: 'success' });
      router.push('/debts');
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'DUPLICATE_DEBT') {
        setDuplicate(err.details as PossibleDuplicate);
        return;
      }
      if (err instanceof ApiClientError && err.code === 'PLAN_LIMIT_REACHED') {
        toast({
          title: 'Limite do plano atingido',
          description: 'Você atingiu o limite de dívidas do plano Básico. Faça upgrade para continuar.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Algo deu errado. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell title="Adicionar dívida" showBack>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowVoice(true)} className="flex-1">
            <Mic className="h-4 w-4 mr-2" /> Falar dívida
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowOcr(true)} className="flex-1">
            <Camera className="h-4 w-4 mr-2" /> Foto do boleto
          </Button>
        </div>

        {showVoice && <VoiceInput onResult={handleVoiceResult} onClose={() => setShowVoice(false)} />}
        {showOcr && <OcrInput onResult={handleOcrResult} onClose={() => setShowOcr(false)} />}

        {duplicate && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Possível dívida duplicada</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Já existe uma dívida parecida com {duplicate.creditor} de valor similar. Quer salvar mesmo assim?
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleSubmit(true)} loading={isLoading}>
                      Salvar mesmo assim
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDuplicate(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creditor">Nome do credor</Label>
            <Input
              id="creditor"
              placeholder="Ex: Banco do Brasil, Sicredi..."
              value={form.creditor}
              onChange={(e) => handleCreditorChange(e.target.value)}
              className={errors.creditor ? 'border-destructive' : ''}
            />
            {suggestions.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setForm((f) => ({ ...f, creditor: s })); setSuggestions([]); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {errors.creditor && <p className="text-xs text-destructive">{errors.creditor}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={errors.amount ? 'border-destructive' : ''}
              step="0.01"
              min="0"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className={errors.dueDate ? 'border-destructive' : ''}
            />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: parcela 3/12, safra 2024..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        <Button
          className="w-full h-12"
          onClick={() => handleSubmit(false)}
          loading={isLoading}
          disabled={!!duplicate}
        >
          Salvar dívida
        </Button>
      </div>
    </AppShell>
  );
}
