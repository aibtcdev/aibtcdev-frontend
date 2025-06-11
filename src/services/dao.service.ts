import { supabase } from "./supabase";
import { sdkFaktory } from "@/lib/faktory-fun";
import type {
  DAO,
  Holder,
  Token,
  Proposal,
  Extension,
  ProposalWithDAO,
} from "@/types";

const SUPPORTED_DAOS = ["SLOW•AIBTC•DAO", "FAST•AIBTC•DAO"];

// Define structure for Market Statistics
interface MarketStats {
  price: number;
  marketCap: number;
  treasuryBalance: number;
  holderCount: number;
}

// Define structure for tokens held in a treasury
interface TreasuryToken {
  type: "FT" | "NFT"; // Fungible Token or Non-Fungible Token
  name: string;
  symbol: string;
  amount: number;
  value: number; // Estimated value (Note: FT value calculation might be simplified)
}

// Define structure for token balance details from Hiro API
interface TokenBalance {
  balance: string;
  total_sent: string;
  total_received: string;
}

// Define structure for token trade details
interface TokenTrade {
  txId: string;
  tokenContract: string;
  type: string; // e.g., "buy" or "sell"
  tokensAmount: number;
  ustxAmount: number;
  pricePerToken: number;
  maker: string; // Address of the trade maker
  timestamp: number; // Unix timestamp
}

// Define structure for the response from Hiro API for address balances
interface HiroBalanceResponse {
  stx: TokenBalance;
  fungible_tokens: {
    [key: string]: TokenBalance; // Key is asset identifier (e.g., contract::token)
  };
  non_fungible_tokens: {
    [key: string]: {
      // Key is asset identifier (e.g., contract::nft)
      count: number;
      total_sent: number;
      total_received: number;
    };
  };
}

// Get Stacks network configuration from environment variables
const STACKS_NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK;

// Internal helper to fetch all extensions
const fetchExtensions = async () => {
  const { data, error } = await supabase.from("extensions").select("*");
  if (error) throw error;
  return data || [];
};

/**
 * Fetches DAOs and extensions.
 *
 * Query key: ['daosWithExtensions']
 */
export const fetchDAOsWithExtension = async (): Promise<DAO[]> => {
  const [{ data: daosData, error: daosError }, extensionsData] =
    await Promise.all([
      supabase
        .from("daos")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("is_broadcasted", true)
        .in("name", SUPPORTED_DAOS),
      fetchExtensions(),
    ]);

  if (daosError) throw daosError;
  if (!daosData) return [];

  return daosData.map((dao) => {
    return {
      ...dao,
      // Map the extensions and filter out based on the dao.id
      extensions: extensionsData?.filter((cap) => cap.dao_id === dao.id) || [],
    };
  });
};

/**
 * Fetches specific DAOs. Remove .in when we need to fetch all the daos
 *
 * Query key: ['daos']
 */
export const fetchDAOs = async (): Promise<DAO[]> => {
  const [{ data: daosData, error: daosError }] = await Promise.all([
    supabase
      .from("daos")
      .select("*")
      .order("created_at", { ascending: false })
      .eq("is_broadcasted", true)
      .in("name", SUPPORTED_DAOS),
  ]);

  if (daosError) throw daosError;
  return daosData ?? [];
};

/**
 * Fetches all token records from the 'tokens' table.
 *
 * Query key: ['tokens']
 */
export const fetchTokens = async (): Promise<Token[]> => {
  const { data, error } = await supabase.from("tokens").select("*");
  if (error) throw error;
  return data || [];
};

/**
 * Fetches a single token record based on the associated DAO ID.
 *
 * Query key: ['token', id]
 */
export const fetchToken = async (id: string): Promise<Token> => {
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("dao_id", id)
    .single();
  if (error) throw error;
  return data;
};

/**
 * Fetches token price, market cap, holders, and 24h change via Faktory SDK.
 *
 * Query key: ['tokenPrice', dex]
 */
export const fetchTokenPrice = async (
  dex: string
): Promise<{
  price: number;
  marketCap: number;
  holders: number;
  price24hChanges: number | null;
}> => {
  const { data } = await sdkFaktory.getToken(dex);
  return {
    price: data.priceUsd ? Number(data.priceUsd) : 0,
    marketCap: data.marketCap ? Number(data.marketCap) : 0,
    holders: data.holders ? Number(data.holders) : 0,
    price24hChanges: data.price24hChanges ? Number(data.price24hChanges) : null,
  };
};

/**
 * Fetches recent trades for a specific token contract via Faktory SDK.
 *
 * Query key: ['tokenTrades', tokenContract]
 */
export const fetchTokenTrades = async (
  tokenContract: string
): Promise<TokenTrade[]> => {
  const { data } = await sdkFaktory.getTokenTrades(tokenContract);
  return data || [];
};

/**
 * Fetches token prices for multiple DAOs concurrently via Faktory SDK using DAO extensions.
 *
 * Query key: ['tokenPrices', daos, tokens]
 */
export const fetchTokenPrices = async (
  daos: DAO[],
  tokens: Token[]
): Promise<
  Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  >
> => {
  const prices: Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  > = {};

  await Promise.all(
    daos.map(async (dao) => {
      const extension = dao.extensions?.find((ext) => ext.type === "dex");
      const token = tokens?.find((t) => t.dao_id === dao.id);

      if (extension?.contract_principal && token) {
        try {
          const { data } = await sdkFaktory.getToken(
            extension.contract_principal
          );
          // console.log(data)
          prices[dao.id] = {
            price: data.priceUsd ? Number(data.priceUsd) : 0,
            marketCap: data.marketCap ? Number(data.marketCap) : 0,
            holders: data.holders ? Number(data.holders) : 0,
            price24hChanges: data.price24hChanges
              ? Number(data.price24hChanges)
              : null,
          };
        } catch (error) {
          console.error(`Error fetching price for DAO ${dao.id}:`, error);
          prices[dao.id] = {
            price: 0,
            marketCap: 0,
            holders: 0,
            price24hChanges: null,
          };
        }
      }
    })
  );

  return prices;
};

/**
 * Fetches all extension records associated with a single, specific DAO ID.
 *
 * Query key: ['daoExtensions', id]
 */
export const fetchDAOExtensions = async (id: string): Promise<Extension[]> => {
  const { data, error } = await supabase
    .from("extensions")
    .select("*")
    .eq("dao_id", id);
  if (error) throw error;
  return data ?? [];
};

/**
 * Fetches FT holders, supply, count, and calculates percentages from Supabase.
 *
 * Query key: ['holders', daoId]
 */
export const fetchHolders = async (
  daoId: string
): Promise<{ holders: Holder[]; totalSupply: number; holderCount: number }> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("dao_id", daoId);

  if (error) throw error;
  if (!data) return { holders: [], totalSupply: 0, holderCount: 0 };

  // Calculate total supply from all holder amounts
  const totalSupply = data.reduce((sum, holder) => {
    return sum + Number(holder.amount || 0);
  }, 0);

  // Map holders with percentage calculations
  const holdersWithPercentage = data.map((holder) => ({
    address: holder.wallet_id || "",
    balance: holder.amount || "0",
    percentage:
      totalSupply > 0 ? (Number(holder.amount || 0) / totalSupply) * 100 : 0,
  }));

  return {
    holders: holdersWithPercentage,
    totalSupply,
    holderCount: data.length,
  };
};

/**
 * Fetches STX, FT, and NFT balances for a Stacks address via Hiro API.
 *
 * Query key: ['treasuryTokens', treasuryAddress, tokenPrice]
 */
export const fetchTreasuryTokens = async (
  treasuryAddress: string,
  tokenPrice: number
): Promise<TreasuryToken[]> => {
  const response = await fetch(
    `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/address/${treasuryAddress}/balances`
  );
  const data = (await response.json()) as HiroBalanceResponse;
  const tokens: TreasuryToken[] = [];

  if (data.stx && Number(data.stx.balance) > 0) {
    const amount = Number(data.stx.balance) / 1_000_000;
    const value = amount * tokenPrice;
    tokens.push({
      type: "FT",
      name: "Stacks",
      symbol: "STX",
      amount,
      value,
    });
  }

  for (const [assetIdentifier, tokenData] of Object.entries(
    data.fungible_tokens
  )) {
    const [, tokenInfo] = assetIdentifier.split("::");
    const amount = Number(tokenData.balance) / 1_000_000;
    const value = amount * tokenPrice;
    tokens.push({
      type: "FT",
      name: tokenInfo || assetIdentifier,
      symbol: tokenInfo || "",
      amount,
      value,
    });
  }

  for (const [assetIdentifier] of Object.entries(data.non_fungible_tokens)) {
    const [, nftInfo] = assetIdentifier.split("::");
    tokens.push({
      type: "NFT",
      name: nftInfo || assetIdentifier,
      symbol: nftInfo || "",
      amount: 1,
      value: 0,
    });
  }

  return tokens;
};

/**
 * Fetches and calculates combined market statistics for a DAO's token.
 *
 * Query key: ['marketStats', dex, daoId, maxSupply]
 */
export const fetchMarketStats = async (
  dex: string,
  daoId: string,
  maxSupply: number
): Promise<MarketStats> => {
  const [holdersData, tokenDetails] = await Promise.all([
    fetchHolders(daoId),
    fetchTokenPrice(dex),
  ]);

  const treasuryBalance = maxSupply * 0.8 * tokenDetails.price;

  return {
    price: tokenDetails.price,
    marketCap: tokenDetails.marketCap,
    treasuryBalance,
    holderCount: holdersData.holderCount || tokenDetails.holders,
  };
};

/**
 * Fetches all proposals associated with a specific DAO ID, newest first.
 *
 * Query key: ['proposals', daoId]
 */
export const fetchProposals = async (daoId: string): Promise<Proposal[]> => {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("dao_id", daoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Fetches all proposals across all DAOs, newest first.
 *
 * Query key: ['allProposals']
 */
export const fetchAllProposals = async (): Promise<ProposalWithDAO[]> => {
  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
            *,
            daos:dao_id (
                name,
                description
            )
        `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Fetches a single proposal by ID with DAO information.
 *
 * Query key: ['proposal', proposalId]
 */
export const fetchProposalById = async (
  proposalId: string
): Promise<ProposalWithDAO | null> => {
  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
            *,
            daos:dao_id (
                name,
                description
            )
        `
    )
    .eq("id", proposalId)
    .single();

  if (error) throw error;
  return data || null;
};

/**
 * Fetches a single broadcasted DAO record based on its URL-decoded name.
 *
 * Query key: ['dao', encodedName]
 */
export const fetchDAOByName = async (
  encodedName: string
): Promise<DAO | null> => {
  // Decode the URL-encoded name
  const name = decodeURIComponent(encodedName);
  const { data } = await supabase
    .from("daos")
    .select("*")
    .eq("name", name)
    .eq("is_broadcasted", true)
    .single();

  if (!data) {
    console.error("No DAO found with name:", name);
    return null;
  }
  // console.log(data)
  return data;
};
