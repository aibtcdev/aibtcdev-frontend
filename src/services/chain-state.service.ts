import { supabase } from "./supabase";
import type { ChainState } from "@/types";

/**
 * Fetches all chain states ordered by creation date
 *
 * @returns Promise resolving to an array of chain states
 *
 * Query key: ['chainStates']
 */
export const fetchChainStates = async (): Promise<ChainState[]> => {
  try {
    const { data, error } = await supabase
      .from("chain_states")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chain states:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchChainStates:", error);
    return [];
  }
};

/**
 * Fetches chain state for a specific network
 *
 * @param network The network to fetch chain state for (e.g., "mainnet", "testnet")
 * @returns Promise resolving to a chain state or null if not found
 *
 * Query key: ['chainState', network]
 */
export const fetchChainStateByNetwork = async (
  network: string
): Promise<ChainState | null> => {
  if (!network) return null;

  try {
    const { data, error } = await supabase
      .from("chain_states")
      .select("*")
      .eq("network", network)
      .single();

    if (error) {
      console.error(
        `Error fetching chain state for network ${network}:`,
        error
      );
      throw error;
    }

    return data;
  } catch (error) {
    console.error(
      `Error in fetchChainStateByNetwork for network ${network}:`,
      error
    );
    return null;
  }
};

/**
 * Fetches the latest chain state (most recently updated)
 *
 * @returns Promise resolving to the latest chain state or null
 *
 * Query key: ['latestChainState']
 */
export const fetchLatestChainState = async (): Promise<ChainState | null> => {
  try {
    const { data, error } = await supabase
      .from("chain_states")
      .select("*")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest chain state:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchLatestChainState:", error);
    return null;
  }
};
