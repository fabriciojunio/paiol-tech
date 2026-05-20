'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, type OfflineAction } from '@/lib/db';
import { apiClient } from '@/lib/api-client';
import { v4 as uuid } from 'uuid';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const refreshCount = async () => {
      if (!db) return;
      const count = await db.actions.count();
      setPendingCount(count);
    };
    void refreshCount();
  }, [isOnline]);

  const queueAction = useCallback(async (type: OfflineAction['type'], payload: Record<string, unknown>) => {
    if (!db) return;
    await db.actions.add({ id: uuid(), type, payload, createdAt: new Date().toISOString(), retries: 0 });
    setPendingCount((c) => c + 1);
  }, []);

  const sync = useCallback(async () => {
    if (!db || !isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const actions = await db.actions.toArray();
      for (const action of actions) {
        try {
          if (action.type === 'CREATE_DEBT') {
            await apiClient.post('/debts', action.payload);
          } else if (action.type === 'MARK_PAID') {
            await apiClient.post(`/debts/${String(action.payload['id'])}/pay`, {});
          } else if (action.type === 'DELETE_DEBT') {
            await apiClient.delete(`/debts/${String(action.payload['id'])}`);
          }
          await db.actions.delete(action.id);
          setPendingCount((c) => Math.max(0, c - 1));
        } catch {
          await db.actions.update(action.id, { retries: action.retries + 1 });
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      void sync();
    }
  }, [isOnline, pendingCount, sync]);

  return { isOnline, pendingCount, isSyncing, queueAction, sync };
}
