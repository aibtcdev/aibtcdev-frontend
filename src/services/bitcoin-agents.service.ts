/**
 * Bitcoin Agents API service
 *
 * Calls the aibtcdev-backend Bitcoin Agents endpoints
 */

import type {
  BitcoinAgent,
  BitcoinAgentFilter,
  BitcoinAgentStats,
  DeathCertificate,
  FoodTier,
  TierInfo,
  AgentCapabilities,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.aibtc.dev";

/**
 * Fetch all Bitcoin Agents with optional filters
 */
export async function fetchBitcoinAgents(
  filter?: BitcoinAgentFilter,
  limit = 50,
  offset = 0
): Promise<{ agents: BitcoinAgent[]; total: number }> {
  const params = new URLSearchParams();

  if (filter?.owner) params.set("owner", filter.owner);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.level) params.set("level", filter.level);
  if (filter?.network) params.set("network", filter.network);
  params.set("limit", limit.toString());
  params.set("offset", offset.toString());

  const response = await fetch(
    `${API_BASE}/bitcoin-agents?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single Bitcoin Agent by ID
 */
export async function fetchBitcoinAgentById(
  agentId: number,
  network = "mainnet"
): Promise<BitcoinAgent | null> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${agentId}?network=${network}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch agent's computed status (current hunger/health)
 */
export async function fetchAgentStatus(
  agentId: number,
  network = "mainnet"
): Promise<{ hunger: number; health: number; alive: boolean } | null> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${agentId}/status?network=${network}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch agent status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch leaderboard (top agents by XP)
 */
export async function fetchLeaderboard(
  network = "mainnet",
  limit = 10
): Promise<{ leaderboard: BitcoinAgent[] }> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/leaderboard?network=${network}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch graveyard (dead agents)
 */
export async function fetchGraveyard(
  network = "mainnet",
  limit = 50,
  offset = 0
): Promise<{ certificates: DeathCertificate[]; total: number }> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/graveyard?network=${network}&limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch graveyard: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch global statistics
 */
export async function fetchGlobalStats(
  network = "mainnet"
): Promise<BitcoinAgentStats> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/stats?network=${network}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch food tier pricing
 */
export async function fetchFoodTiers(): Promise<{
  food_tiers: Record<number, FoodTier>;
  mint_cost: number;
}> {
  const response = await fetch(`${API_BASE}/bitcoin-agents/food-tiers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch food tiers: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch tier info (evolution levels)
 */
export async function fetchTierInfo(): Promise<{ tiers: TierInfo[] }> {
  const response = await fetch(`${API_BASE}/bitcoin-agents/tier-info`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tier info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch agent capabilities (available tools)
 */
export async function fetchAgentCapabilities(
  agentId: number,
  network = "mainnet"
): Promise<AgentCapabilities> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${agentId}/capabilities?network=${network}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch capabilities: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Request to mint a new agent (returns 402 with payment details)
 */
export async function requestMintAgent(
  name: string,
  network = "mainnet"
): Promise<{
  status: string;
  action: string;
  name: string;
  cost_sats: number;
  payment_address: string;
  message: string;
}> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/mint?name=${encodeURIComponent(name)}&network=${network}`,
    { method: "POST" }
  );

  // 402 is expected - it contains payment details
  if (response.status !== 402) {
    throw new Error(`Unexpected response: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Request to feed an agent (returns 402 with payment details)
 */
export async function requestFeedAgent(
  agentId: number,
  foodTier: number,
  network = "mainnet"
): Promise<{
  status: string;
  action: string;
  agent_id: number;
  food_tier: number;
  food_name: string;
  cost_sats: number;
  xp_reward: number;
  payment_address: string;
  message: string;
}> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${agentId}/feed?food_tier=${foodTier}&network=${network}`,
    { method: "POST" }
  );

  // 402 is expected - it contains payment details
  if (response.status !== 402) {
    throw new Error(`Unexpected response: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch death certificate for a dead agent
 */
export async function fetchDeathCertificate(
  agentId: number,
  network = "mainnet"
): Promise<DeathCertificate | null> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${agentId}/death-certificate?network=${network}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch death certificate: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Execute an agent visit (social interaction)
 */
export async function visitAgent(
  visitorId: number,
  hostId: number,
  network = "mainnet"
): Promise<{
  success: boolean;
  visitor_xp_earned?: number;
  host_xp_earned?: number;
  message?: string;
  error?: string;
}> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${visitorId}/visit/${hostId}?network=${network}`,
    { method: "POST" }
  );

  return response.json();
}

/**
 * Check if an agent should die
 */
export async function checkAgentDeath(
  agentId: number,
  network = "mainnet"
): Promise<{ agent_id: number; died: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE}/bitcoin-agents/${agentId}/check-death?network=${network}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Failed to check death: ${response.statusText}`);
  }

  return response.json();
}
