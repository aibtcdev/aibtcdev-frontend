export interface Vote {
  id: string;
  created_at: string;
  dao_id: string;
  dao_name: string;
  wallet_id: string | null;
  profile_id: string | null;
  answer: boolean;
  proposal_id: string;
  proposal_title: string;
  proposal_content: string | null;
  reasoning: string | null;
  tx_id: string | null;
  address: string | null;
  amount: string | null;
  prompt: string | null;
  confidence: number | null;
  voted: boolean | null;
  evaluation_score: Record<string, number> | null;
  flags: string[] | null;
  // Proposal timing fields for block height filtering
  vote_start: bigint | null;
  vote_end: bigint | null;
  exec_start: bigint | null;
  exec_end: bigint | null;
  // Blockchain proposal ID from proposals table (integer used for API queries)
  blockchain_proposal_id: bigint | null;
}
