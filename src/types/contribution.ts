export interface ContributionHistory {
  id: string;
  dao_name: string;
  proposal_title: string;
  proposal_id: bigint;
  created_at: string;
  executed: boolean;
  met_quorum: boolean;
  met_threshold: boolean;
  passed: boolean;
  // agent_vote: boolean;
  reward_amount: number;
  reward_type: "gain" | "loss";
}

export interface SupabaseProposal {
  id: string;
  proposal_id: bigint;
  title: string;
  created_at: string;
  executed: boolean;
  met_quorum: boolean;
  met_threshold: boolean;
  passed: boolean;
  contract_caller: string;
  daos: {
    name: string;
  } | null;
}
