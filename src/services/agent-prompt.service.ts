import { supabase } from "./supabase";
import type { AgentPrompt } from "@/types";

/**
 * Fetch all agent prompts
 *
 * Query key: ['agentPrompts']
 */
export const fetchAgentPrompts = async (): Promise<AgentPrompt[]> => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch agent prompts by DAO ID
 *
 * Query key: ['agentPrompts', 'dao', daoId]
 */
export const fetchAgentPromptsByDao = async (
  daoId: string
): Promise<AgentPrompt[]> => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("dao_id", daoId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch agent prompts by agent ID
 *
 * Query key: ['agentPrompts', 'agent', agentId]
 */
export const fetchAgentPromptsByAgent = async (
  agentId: string
): Promise<AgentPrompt[]> => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch agent prompts by profile ID
 *
 * Query key: ['agentPrompts', 'profile', profileId]
 */
export const fetchAgentPromptsByProfile = async (
  profileId: string
): Promise<AgentPrompt[]> => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch a specific agent prompt
 *
 * Query key: ['agentPrompt', promptId]
 */
export const fetchAgentPrompt = async (
  promptId: string
): Promise<AgentPrompt | null> => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Create a new agent prompt
 *
 * Mutation key: ['createAgentPrompt']
 */
export const createAgentPrompt = async (
  prompt: Omit<AgentPrompt, "id" | "created_at" | "updated_at">
): Promise<AgentPrompt> => {
  const { data, error } = await supabase
    .from("prompts")
    .insert([prompt])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Update an existing agent prompt
 *
 * Mutation key: ['updateAgentPrompt', promptId]
 */
export const updateAgentPrompt = async (
  promptId: string,
  updates: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>
): Promise<AgentPrompt> => {
  const { data, error } = await supabase
    .from("prompts")
    .update(updates)
    .eq("id", promptId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Delete an agent prompt
 *
 * Mutation key: ['deleteAgentPrompt', promptId]
 */
export const deleteAgentPrompt = async (promptId: string): Promise<void> => {
  const { error } = await supabase.from("prompts").delete().eq("id", promptId);

  if (error) {
    throw error;
  }
};
