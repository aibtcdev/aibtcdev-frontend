export interface Veto {
  id: string;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  dao_id: string | null;
  agent_id: string | null;
  proposal_id: string | null;
  profile_id: string | null;
  tx_id: string | null;
  address: string | null;
  amount: string | null;
  contract_caller: string | null;
  tx_sender: string | null;
  vetoer_user_id: number | null;
  reasoning: string | null;
  // Additional fields for UI display (populated via joins)
  dao_name?: string;
  proposal_title?: string;
}

// Enhanced Veto type with related entity information for detailed views
export interface VetoWithDetails extends Veto {
  daos?: {
    id: string;
    name: string;
  };
  proposals?: {
    id: string;
    title: string;
    vote_start: bigint | null;
    vote_end: bigint | null;
    exec_start: bigint | null;
    exec_end: bigint | null;
  };
  agents?: {
    id: string;
  };
}
