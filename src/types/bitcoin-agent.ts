/**
 * Bitcoin Agent types for Tamagotchi-style on-chain AI agents
 */

export type BitcoinAgentLevel =
  | "hatchling"
  | "junior"
  | "senior"
  | "elder"
  | "legendary";

export type BitcoinAgentStatus = "alive" | "dead";

export interface BitcoinAgent {
  agent_id: number;
  owner: string;
  name: string;
  hunger: number;
  health: number;
  xp: number;
  level: BitcoinAgentLevel;
  birth_block: number;
  last_fed: number;
  total_fed_count: number;
  alive: boolean;
  // Computed state
  computed_hunger?: number;
  computed_health?: number;
  // Face data
  face_svg_url?: string;
  face_image_url?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface DeathCertificate {
  agent_id: number;
  name: string;
  owner: string;
  death_block: number;
  birth_block: number;
  final_xp: number;
  final_level: BitcoinAgentLevel;
  total_feedings: number;
  epitaph?: string;
  cause_of_death: "starvation" | "neglect";
  lifespan_blocks: number;
}

export interface BitcoinAgentFilter {
  owner?: string;
  status?: BitcoinAgentStatus;
  level?: BitcoinAgentLevel;
  network?: "mainnet" | "testnet";
}

export interface FoodTier {
  tier: number;
  name: string;
  cost: number;
  xp: number;
}

export interface TierInfo {
  level: number;
  name: string;
  xp_required: number;
  tools_count: number;
  new_capabilities: string[];
}

export interface BitcoinAgentStats {
  total_agents: number;
  alive_count: number;
  total_deaths: number;
  total_feedings: number;
  network: string;
}

export interface AgentCapabilities {
  agent_id: number;
  level: number;
  level_name: string;
  xp: number;
  total_tools: number;
  tools_by_category: {
    read_only: string[];
    transfers: string[];
    trading: string[];
    dao: string[];
    social: string[];
    advanced: string[];
  };
  all_tools: string[];
}

// XP thresholds for levels
export const XP_THRESHOLDS: Record<BitcoinAgentLevel, number> = {
  hatchling: 0,
  junior: 500,
  senior: 2000,
  elder: 10000,
  legendary: 50000,
};

// Level colors for UI
export const LEVEL_COLORS: Record<BitcoinAgentLevel, string> = {
  hatchling: "bg-gray-500",
  junior: "bg-green-500",
  senior: "bg-blue-500",
  elder: "bg-purple-500",
  legendary: "bg-yellow-500",
};

// Level badge variants
export const LEVEL_BADGE_VARIANTS: Record<
  BitcoinAgentLevel,
  "default" | "secondary" | "destructive" | "outline"
> = {
  hatchling: "secondary",
  junior: "default",
  senior: "default",
  elder: "default",
  legendary: "default",
};
