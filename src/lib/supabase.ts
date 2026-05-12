import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anon ? createClient(url, anon) : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Copie .env.example para .env.local e preencha VITE_SUPABASE_*.",
    );
  }
  return supabase;
}
