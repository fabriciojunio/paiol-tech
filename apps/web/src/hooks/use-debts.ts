'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Debt, DebtFilters } from '@paiol/types';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useToast } from '@/components/toast-provider';

interface UseDebtsOptions {
  filters?: DebtFilters;
  page?: number;
  limit?: number;
}

interface UseDebtsResult {
  debts: Debt[];
  total: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  markAsPaid: (id: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
}

export function useDebts({ filters, page = 1, limit = 20 }: UseDebtsOptions = {}): UseDebtsResult {
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.creditor) params.set('creditor', filters.creditor);

    apiClient
      .getRaw<Debt[]>(`/debts?${params}`)
      .then((res) => {
        if (cancelled) return;
        setDebts(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Não conseguimos carregar suas dívidas. Tente novamente.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, filters?.status, filters?.creditor, tick]);

  const markAsPaid = useCallback(async (id: string) => {
    try {
      await apiClient.post(`/debts/${id}/pay`, {});
      toast({ title: 'Dívida marcada como paga!', variant: 'success' });
      reload();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Algo deu errado. Tente novamente.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    }
  }, [reload, toast]);

  const deleteDebt = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/debts/${id}`);
      toast({ title: 'Dívida removida.' });
      reload();
    } catch {
      toast({ title: 'Erro ao remover dívida.', variant: 'destructive' });
    }
  }, [reload, toast]);

  return { debts, total, isLoading, error, reload, markAsPaid, deleteDebt };
}
