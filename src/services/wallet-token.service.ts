import { supabase } from "./supabase";
import type { WalletToken } from "@/types";

/**
 * Fetch all wallet tokens
 *
 * Query key: ['walletTokens']
 */
export const fetchWalletTokens = async (): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch wallet tokens by DAO ID
 *
 * Query key: ['walletTokens', 'dao', daoId]
 */
export const fetchWalletTokensByDao = async (
  daoId: string
): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("dao_id", daoId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch wallet tokens by wallet ID
 *
 * Query key: ['walletTokens', 'wallet', walletId]
 */
export const fetchWalletTokensByWallet = async (
  walletId: string
): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch wallet tokens by token ID
 *
 * Query key: ['walletTokens', 'token', tokenId]
 */
export const fetchWalletTokensByToken = async (
  tokenId: string
): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("token_id", tokenId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Fetch a specific wallet token
 *
 * Query key: ['walletToken', tokenId]
 */
export const fetchWalletToken = async (
  tokenId: string
): Promise<WalletToken | null> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("id", tokenId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
