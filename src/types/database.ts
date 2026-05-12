/** Alinhado a supabase/migrations — tipos para o client. */

export type ProfileRole = "operator" | "guardian" | "admin";

export type ValidationEventType =
  | "registered"
  | "vote"
  | "confirmed"
  | "rejected";

export interface ProfileRow {
  id: string;
  display_name: string | null;
  role: ProfileRole;
  wallet_public_key: string | null;
  created_at: string;
}

export interface TwinRow {
  id: string;
  twin_id: string;
  content_hash: string;
  ai_score: number;
  votes: number;
  is_confirmed: boolean;
  solana_twin_pda: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationEventRow {
  id: number;
  twin_uuid: string;
  event_type: ValidationEventType;
  payload: Record<string, unknown> | null;
  created_at: string;
}
