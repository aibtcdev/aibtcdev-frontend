export interface Profile {
  email: string;
  assigned_agent_address: string | null;
}

export interface ProfileWithBalance extends Profile {
  portfolioValue: number;
  rank: number;
  isLoadingBalance: boolean;
  balances?: BalanceResponse; // Optional because it may be undefined until loaded
  tokenPrices?: Record<string, number>; // Map contract ID to token price
}

export interface BalanceResponse {
  stx: {
    balance: string;
  };
  fungible_tokens: {
    [key: string]: {
      balance: string;
    };
  };
}

export interface TokenPrice {
  symbol?: string;
  contract_id?: string;
  metrics: {
    price_usd: number;
  };
  decimals: number;
}

export interface Wallet {
  id: string;
  created_at: string;
  agent_id: string;
  profile_id: string;
  mainnet_address: string;
  testnet_address: string;
  secret_id: string;
}

export interface WalletToken {
  id: string; // UUID
  created_at: Date; // Timestamp with time zone
  updated_at?: Date; // Timestamp without time zone (optional)
  dao_id?: string; // UUID (optional)
  token_id?: string; // UUID (optional)
  wallet_id?: string; // UUID (optional)
  amount?: string; // Amount as text (optional)
}
