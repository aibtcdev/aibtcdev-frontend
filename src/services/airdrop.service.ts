import { supabase } from "./supabase";
import type {
  Airdrop,
  CreateAirdrop,
  UpdateAirdrop,
  AirdropWithDetails,
} from "@/types";

/**
 * Fetches all airdrops ordered by creation date (newest first)
 *
 * @returns Promise resolving to an array of airdrops
 *
 * Query key: ['airdrops']
 */
export const fetchAirdrops = async (): Promise<Airdrop[]> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching airdrops:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAirdrops:", error);
    return [];
  }
};

/**
 * Fetches a single airdrop by ID
 *
 * @param airdropId The ID of the airdrop to fetch
 * @returns Promise resolving to an airdrop or null if not found
 *
 * Query key: ['airdrop', airdropId]
 */
export const fetchAirdropById = async (
  airdropId: string | null | undefined
): Promise<Airdrop | null> => {
  if (!airdropId) return null;

  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .eq("id", airdropId)
      .single();

    if (error) {
      console.error(`Error fetching airdrop with ID ${airdropId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in fetchAirdropById for ID ${airdropId}:`, error);
    return null;
  }
};

/**
 * Fetches airdrop by transaction hash
 *
 * @param txHash The transaction hash to fetch airdrop for
 * @returns Promise resolving to an airdrop or null if not found
 *
 * Query key: ['airdrop', 'txHash', txHash]
 */
export const fetchAirdropByTxHash = async (
  txHash: string | null | undefined
): Promise<Airdrop | null> => {
  if (!txHash) return null;

  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .eq("tx_hash", txHash)
      .single();

    if (error) {
      console.error(`Error fetching airdrop with tx_hash ${txHash}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(
      `Error in fetchAirdropByTxHash for tx_hash ${txHash}:`,
      error
    );
    return null;
  }
};

/**
 * Fetches airdrops for a specific contract identifier
 *
 * @param contractIdentifier The contract identifier to filter by
 * @returns Promise resolving to an array of airdrops
 *
 * Query key: ['airdrops', 'contract', contractIdentifier]
 */
export const fetchAirdropsByContract = async (
  contractIdentifier: string
): Promise<Airdrop[]> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .eq("contract_identifier", contractIdentifier)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching airdrops by contract:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAirdropsByContract:", error);
    return [];
  }
};

/**
 * Fetches airdrops by sender address
 *
 * @param sender The sender address to filter by
 * @returns Promise resolving to an array of airdrops
 *
 * Query key: ['airdrops', 'sender', sender]
 */
export const fetchAirdropsBySender = async (
  sender: string
): Promise<Airdrop[]> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .eq("sender", sender)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching airdrops by sender:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAirdropsBySender:", error);
    return [];
  }
};

/**
 * Fetches airdrops that contain a specific recipient
 *
 * @param recipient The recipient address to search for
 * @returns Promise resolving to an array of airdrops
 *
 * Query key: ['airdrops', 'recipient', recipient]
 */
export const fetchAirdropsByRecipient = async (
  recipient: string
): Promise<Airdrop[]> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .contains("recipients", [recipient])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching airdrops by recipient:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAirdropsByRecipient:", error);
    return [];
  }
};

/**
 * Fetches airdrops associated with a specific proposal
 *
 * @param proposalTxId The proposal transaction ID
 * @returns Promise resolving to an array of airdrops
 *
 * Query key: ['airdrops', 'proposal', proposalTxId]
 */
export const fetchAirdropsByProposal = async (
  proposalTxId: string
): Promise<Airdrop[]> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .eq("proposal_tx_id", proposalTxId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching airdrops by proposal:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAirdropsByProposal:", error);
    return [];
  }
};

/**
 * Fetches airdrops within a specific block height range
 *
 * @param fromBlock Starting block height (inclusive)
 * @param toBlock Ending block height (inclusive)
 * @returns Promise resolving to an array of airdrops
 *
 * Query key: ['airdrops', 'blockRange', fromBlock, toBlock]
 */
export const fetchAirdropsByBlockRange = async (
  fromBlock: number,
  toBlock: number
): Promise<Airdrop[]> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .gte("block_height", fromBlock)
      .lte("block_height", toBlock)
      .order("block_height", { ascending: false });

    if (error) {
      console.error("Error fetching airdrops by block range:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAirdropsByBlockRange:", error);
    return [];
  }
};

/**
 * Creates a new airdrop record
 *
 * @param airdrop The airdrop data to insert
 * @returns Promise resolving to the created airdrop
 *
 * Mutation key: ['createAirdrop']
 */
export const createAirdrop = async (
  airdrop: CreateAirdrop
): Promise<Airdrop | null> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .insert([airdrop])
      .select()
      .single();

    if (error) {
      console.error("Error creating airdrop:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createAirdrop:", error);
    return null;
  }
};

/**
 * Updates an existing airdrop
 *
 * @param airdropId The ID of the airdrop to update
 * @param updates The fields to update
 * @returns Promise resolving to the updated airdrop
 *
 * Mutation key: ['updateAirdrop', airdropId]
 */
export const updateAirdrop = async (
  airdropId: string,
  updates: Partial<Omit<Airdrop, "id" | "created_at" | "updated_at">>
): Promise<Airdrop | null> => {
  try {
    const { data, error } = await supabase
      .from("airdrops")
      .update(updates)
      .eq("id", airdropId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating airdrop with ID ${airdropId}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in updateAirdrop for ID ${airdropId}:`, error);
    return null;
  }
};

/**
 * Deletes an airdrop by ID
 *
 * @param airdropId The ID of the airdrop to delete
 * @returns Promise resolving to void
 *
 * Mutation key: ['deleteAirdrop', airdropId]
 */
export const deleteAirdrop = async (airdropId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("airdrops")
      .delete()
      .eq("id", airdropId);

    if (error) {
      console.error(`Error deleting airdrop with ID ${airdropId}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error in deleteAirdrop for ID ${airdropId}:`, error);
    throw error;
  }
};

/**
 * Fetches recent successful airdrops (last 30 days)
 *
 * @param limit Optional limit for number of results (default: 50)
 * @returns Promise resolving to an array of recent airdrops
 *
 * Query key: ['airdrops', 'recent', limit]
 */
export const fetchRecentAirdrops = async (
  limit: number = 50
): Promise<Airdrop[]> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("airdrops")
      .select("*")
      .eq("success", true)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent airdrops:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchRecentAirdrops:", error);
    return [];
  }
};

/**
 * Helper function to format airdrop amounts for display
 *
 * @param amount String representing raw airdrop amount
 * @param decimals Number of decimal places (default: 6)
 * @returns Formatted string representation
 */
export const formatAirdropAmount = (
  amount: string | null | undefined,
  decimals: number = 6
): string => {
  if (amount === null || amount === undefined || amount === "") return "0";
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount === 0) return "0";

  // Convert from micro-tokens to tokens (assuming 1e6 decimals by default)
  const divisor = Math.pow(10, decimals);
  const adjustedAmount = numericAmount / divisor;

  return adjustedAmount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

/**
 * Helper function to get recipient count from airdrop
 *
 * @param airdrop The airdrop object
 * @returns Number of recipients
 */
export const getRecipientCount = (airdrop: Airdrop): number => {
  return airdrop.recipients ? airdrop.recipients.length : 0;
};

/**
 * Helper function to check if an address is a recipient of an airdrop
 *
 * @param airdrop The airdrop object
 * @param address The address to check
 * @returns Boolean indicating if address is a recipient
 */
export const isRecipient = (airdrop: Airdrop, address: string): boolean => {
  return airdrop.recipients ? airdrop.recipients.includes(address) : false;
};
