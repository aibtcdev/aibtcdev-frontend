export interface Airdrop {
  id: string;
  created_at: string;
  updated_at: string;

  // Unique transaction identifier
  tx_hash: string;

  // Blockchain metadata
  block_height: number;
  timestamp: string;
  sender: string;
  contract_identifier: string;
  token_identifier: string;
  success: boolean;

  // Airdrop details
  total_amount_airdropped: string; // String to handle large numbers
  recipients: string[];

  // Optional link to proposal if used for boosting
  proposal_tx_id: string | null;
}

// Enhanced Airdrop type with additional computed fields for display
export interface AirdropWithDetails extends Airdrop {
  recipient_count?: number;
  formatted_amount?: string;
  dao_name?: string;
  proposal_title?: string;
}

// Type for creating new airdrops (without auto-generated fields)
export type CreateAirdrop = Omit<Airdrop, "id" | "created_at" | "updated_at">;

// Type for updating airdrops (all fields optional except id)
export type UpdateAirdrop = Partial<
  Omit<Airdrop, "id" | "created_at" | "updated_at">
> & {
  id: string;
};
