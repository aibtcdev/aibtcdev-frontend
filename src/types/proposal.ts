export interface Proposal {
  id: string;
  summary: string;
  created_at: string;
  title: string;
  status: string;
  contract_principal: string;
  tx_id: string;
  dao_id: string;
  proposal_id: bigint;
  action: string;
  caller: string;
  creator: string;
  liquid_tokens: string;
  content: string;
  concluded_by: string;
  executed: boolean;
  met_quorum: boolean;
  met_threshold: boolean;
  passed: boolean;
  votes_against: string;
  votes_for: string;
  bond: string;
  type: string;
  contract_caller: string;
  created_btc: bigint;
  created_stx: bigint;
  exec_end: bigint;
  exec_start: bigint;
  memo: string;
  tx_sender: string;
  vote_end: bigint;
  vote_start: bigint;
  voting_delay: bigint;
  voting_period: bigint;
  voting_quorum: bigint;
  voting_reward: string;
  voting_threshold: bigint;
  evaluation_score: Record<string, number>;
  flags: string[];
}

// Enhanced Proposal type with DAO information for all proposals view
export interface ProposalWithDAO extends Proposal {
  daos?: {
    name: string;
    description: string;
  };
}
