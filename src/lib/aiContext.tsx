/**
 * AIContext — Global AI mode manager for PequeAprendo
 * Controls: enabled/disabled toggle, daily limit detection, and mode display
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── Daily usage tracking (persisted in localStorage) ─────────────────────────
const STORAGE_KEY = 'peque_ai_quota';
const DAILY_SOFT_LIMIT = 80; // requests per day before switching to normal mode

interface DailyQuota {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function loadQuota(): DailyQuota {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: DailyQuota = JSON.parse(stored);
      if (parsed.date === getTodayStr()) return parsed;
    }
  } catch {}
  return { date: getTodayStr(), count: 0 };
}

function saveQuota(q: DailyQuota) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  } catch {}
}

// ─── Context Type ─────────────────────────────────────────────────────────────
export type AIMode = 'ai' | 'normal';

interface AIContextValue {
  mode: AIMode;               // current mode
  isEnabled: boolean;         // is AI active right now?
  isLimitReached: boolean;    // daily quota hit?
  dailyCount: number;         // how many AI calls today
  dailyLimit: number;         // soft limit value
  toggleAI: () => void;       // manual toggle
  recordUsage: () => void;    // call after each AI request
  resetLimit: () => void;     // admin reset (for testing)
}

const AIContext = createContext<AIContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AIProvider({ children }: { children: ReactNode }) {
  const [manuallyEnabled, setManuallyEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('peque_ai_enabled') !== 'false'; } 
    catch { return true; }
  });
  const [quota, setQuota] = useState<DailyQuota>(loadQuota);

  const isLimitReached = quota.count >= DAILY_SOFT_LIMIT;
  const isEnabled = manuallyEnabled && !isLimitReached;
  const mode: AIMode = isEnabled ? 'ai' : 'normal';

  // Persist manual toggle
  useEffect(() => {
    try { localStorage.setItem('peque_ai_enabled', String(manuallyEnabled)); }
    catch {}
  }, [manuallyEnabled]);

  const toggleAI = useCallback(() => {
    setManuallyEnabled(prev => !prev);
  }, []);

  const recordUsage = useCallback(() => {
    setQuota(prev => {
      const today = getTodayStr();
      const next = prev.date === today
        ? { date: today, count: prev.count + 1 }
        : { date: today, count: 1 };  // new day — reset
      saveQuota(next);
      return next;
    });
  }, []);

  const resetLimit = useCallback(() => {
    const fresh: DailyQuota = { date: getTodayStr(), count: 0 };
    saveQuota(fresh);
    setQuota(fresh);
    setManuallyEnabled(true);
  }, []);

  return (
    <AIContext.Provider value={{
      mode,
      isEnabled,
      isLimitReached,
      dailyCount: quota.count,
      dailyLimit: DAILY_SOFT_LIMIT,
      toggleAI,
      recordUsage,
      resetLimit,
    }}>
      {children}
    </AIContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used inside <AIProvider>');
  return ctx;
}
