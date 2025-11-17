import { supabase } from "./supabase";
import type { Agent } from "@/types";

/**
 * Fetches all DAO Manager agents that are not archived
 *
 * @param profileId Optional profile ID to filter agents by user
 * @returns Promise resolving to an array of agents
 *
 * Query key: ['agents', profileId]
 * Used in:
 * - src/components/chat/agent-selector.tsx
 * - src/components/aidaos/DaoAgentSelector.tsx
 * - src/hooks/useAgentAccount.ts
 */
export const fetchAgents = async (profileId?: string): Promise<Agent[]> => {
  try {
    let query = supabase.from("agents").select("*").eq("is_archived", false);

    // Filter by profile_id if provided (for user-specific agents)
    if (profileId) {
      query = query.eq("profile_id", profileId);
    }

    const { data, error } = await query;
    // .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAgents:", error);
    return [];
  }
};

/**
 * Fetches a single agent by ID
 *
 * @param agentId The ID of the agent to fetch
 * @returns Promise resolving to an agent or null if not found
 *
 * Query key: ['agent', agentId]
 * Used in:
 * - src/components/chat/agent-selector.tsx
 * - src/app/agents/[id]/edit/page.tsx
 */
export const fetchAgentById = async (
  agentId: string | null | undefined
): Promise<Agent | null> => {
  if (!agentId) return null;

  try {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error(`Error fetching agent with ID ${agentId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in fetchAgentById for ID ${agentId}:`, error);
    return null;
  }
};

/**
 * Fetches an agent's name by ID
 *
 * @param agentId The ID of the agent
 * @returns Promise resolving to the agent's name or null
 *
 * Query key: ['agentName', agentId]
 * Used in:
 * - src/components/chat/chat-window.tsx
 * - src/components/chat/message-list.tsx
 */
export const fetchAgentName = async (
  agentId: string | undefined
): Promise<string | null> => {
  if (!agentId) return null;

  try {
    const { data, error } = await supabase
      .from("agents")
      .select("name")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error(`Error fetching agent name for ID ${agentId}:`, error);
      throw error;
    }

    return data?.name || null;
  } catch (error) {
    console.error(`Error in fetchAgentName for ID ${agentId}:`, error);
    return null;
  }
};

/**
 * Creates a new agent
 *
 * @param agent The agent data to insert
 * @returns Promise resolving to the created agent
 *
 * Mutation key: ['createAgent']
 */
export const createAgent = async (
  agent: Partial<Agent>
): Promise<Agent | null> => {
  try {
    const { data, error } = await supabase
      .from("agents")
      .insert([agent])
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createAgent:", error);
    return null;
  }
};

/**
 * Updates an existing agent
 *
 * @param agentId The ID of the agent to update
 * @param updates The fields to update
 * @returns Promise resolving to the updated agent
 *
 * Mutation key: ['updateAgent', agentId]
 */
export const updateAgent = async (
  agentId: string,
  updates: Partial<Agent>
): Promise<Agent | null> => {
  try {
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating agent with ID ${agentId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in updateAgent for ID ${agentId}:`, error);
    return null;
  }
};

/**
 * Archives or unarchives an agent
 *
 * @param agentId The ID of the agent
 * @param archive Whether to archive (true) or unarchive (false)
 * @returns Promise resolving to the updated agent
 *
 * Mutation key: ['archiveAgent', agentId, archive]
 */
export const archiveAgent = async (
  agentId: string,
  archive: boolean
): Promise<Agent | null> => {
  try {
    const { data, error } = await supabase
      .from("agents")
      .update({ is_archived: archive })
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      console.error(
        `Error ${archive ? "archiving" : "unarchiving"} agent with ID ${agentId}:`,
        error
      );
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in archiveAgent for ID ${agentId}:`, error);
    return null;
  }
};
