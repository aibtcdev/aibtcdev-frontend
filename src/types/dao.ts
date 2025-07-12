export interface DAO {
  id: string;
  name: string;
  website_url: string;
  x_url: string;
  telegram_url: string;
  mission: string;
  description: string;
  image_url: string;
  is_graduated: boolean;
  is_deployed: boolean;
  created_at: string;
  author_id: string;
  user_id?: string;
  extensions?: Array<{
    id: string;
    type: string;
    contract_principal?: string;
  }>;
}

export interface Token {
  id: string;
  dao_id: string;
  contract_principal: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string;
  max_supply: number;
}

export interface Holder {
  address: string;
  balance: string;
  percentage: number;
}

export interface Extension {
  subtype: string;
  id: string;
  created_at: string;
  updated_at: string;
  dao_id: string;
  type: string;
  contract_principal: string;
  tx_id: string;
  symbol: string | null;
  decimals: number | null;
  max_supply: string | null;
  uri: string | null;
  image_url: string | null;
  description: string | null;
  is_deployed: boolean;
  status: string | null;
}

export type SortField =
  | "created_at"
  | "price"
  | "price24hChanges"
  | "marketCap"
  | "newest"
  | "oldest"
  | "holders";
