import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { TwinRow } from "@/types/database";

interface UseTwinsResult {
  twins: TwinRow[];
  loading: boolean;
  error: string | null;
  configured: boolean;
}

/**
 * Lista twins do Supabase quando o client está configurado.
 * Sem env: retorna lista vazia e configured=false (dashboard pode usar dados demo).
 */
export function useTwins(): UseTwinsResult {
  const [twins, setTwins] = useState<TwinRow[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from("twins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setTwins([]);
      } else {
        setTwins((data ?? []) as TwinRow[]);
      }
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    twins,
    loading,
    error,
    configured: Boolean(supabase),
  };
}

function truncateHash(hex: string, head = 6, tail = 3): string {
  if (hex.length <= head + tail + 1) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

export function formatTwinHashDisplay(contentHash: string): string {
  return truncateHash(contentHash);
}

export function formatAiScorePercent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}
