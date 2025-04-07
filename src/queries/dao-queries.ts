import { supabase } from "@/utils/supabase/client";
import { sdkFaktory } from "@/lib/faktory-fun";
import type { DAO, Holder, Token, Proposal, Extension } from "@/types/supabase";

// Constants
const STACKS_NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK;

// Types
interface MarketStats {
    price: number;
    marketCap: number;
    treasuryBalance: number;
    holderCount: number;
}

interface TreasuryToken {
    type: "FT" | "NFT";
    name: string;
    symbol: string;
    amount: number;
    value: number;
}

interface TokenBalance {
    balance: string;
    total_sent: string;
    total_received: string;
}

interface TokenTrade {
    txId: string;
    tokenContract: string;
    type: string;
    tokensAmount: number;
    ustxAmount: number;
    pricePerToken: number;
    maker: string;
    timestamp: number;
}

interface HiroBalanceResponse {
    stx: TokenBalance;
    fungible_tokens: {
        [key: string]: TokenBalance;
    };
    non_fungible_tokens: {
        [key: string]: {
            count: number;
            total_sent: number;
            total_received: number;
        };
    };
}

interface HiroHolderResponse {
    total_supply: string;
    limit: number;
    offset: number;
    total: number;
    results: {
        address: string;
        balance: string;
    }[];
}

interface TokenPriceResponse {
    price: number;
    marketCap: number;
    holders: number;
    price24hChanges: number | null;
}

/**
 * Fetch X users from the database
 * @returns Array of X users
 */
export const fetchXUsers = async () => {
    const { data, error } = await supabase.from("x_users").select("id, user_id");

    if (error) throw error;
    return data || [];
};

/**
 * Fetch all extensions from the database
 * @returns Array of extensions
 */
export const fetchExtensions = async () => {
    const { data, error } = await supabase.from("extensions").select("*");

    if (error) throw error;
    return data || [];
};

/**
 * Fetch DAOs with filtering for active DAOs
 * @returns Array of DAOs with extensions
 */
export const fetchDAOs = async (): Promise<DAO[]> => {
    try {
        const [{ data: daosData, error: daosError }, xUsersData, extensionsData] =
            await Promise.all([
                supabase
                    .from("daos")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .eq("is_broadcasted", true)
                    // SHOULD BE GOOD
                    // FETCH ONLY MEDIA3(FOR TESTNET REMOVE IN MAINNET LATER) AND FACES FOR MAINNET
                    .in("name", ["MEDIA3", "FACES"]),
                fetchXUsers(),
                fetchExtensions(),
            ]);

        if (daosError) throw daosError;
        if (!daosData) return [];

        return daosData.map((dao) => {
            const xUser = xUsersData?.find((user) => user.id === dao.author_id);
            return {
                ...dao,
                user_id: xUser?.user_id,
                extensions: extensionsData?.filter((cap) => cap.dao_id === dao.id) || [],
            };
        });
    } catch (error) {
        console.error("Error fetching DAOs:", error);
        return [];
    }
};

/**
 * Fetch all DAOs without additional data
 * @returns Array of DAOs
 */
export const fetchAllDAOs = async (): Promise<DAO[]> => {
    try {
        const { data: daosData, error: daosError } = await supabase
            .from("daos")
            .select("*")
            .order("created_at", { ascending: false })
            .eq("is_broadcasted", true)
            // Add the same filter as in fetchDAOs
            .in("name", ["MEDIA3", "FACES"]);

        if (daosError) throw daosError;
        return daosData ?? [];
    } catch (error) {
        console.error("Error fetching all DAOs:", error);
        return [];
    }
};

/**
 * Fetch a single DAO by ID
 * @param id DAO ID
 * @returns DAO object
 */
export const fetchDAO = async (id: string): Promise<DAO | null> => {
    try {
        const { data, error } = await supabase
            .from("daos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error fetching DAO with ID ${id}:`, error);
        return null;
    }
};

/**
 * Fetch all tokens
 * @returns Array of tokens
 */
export const fetchTokens = async (): Promise<Token[]> => {
    try {
        const { data, error } = await supabase.from("tokens").select("*");
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching tokens:", error);
        return [];
    }
};

/**
 * Fetch a token for a specific DAO
 * @param id DAO ID
 * @returns Token object
 */
export const fetchToken = async (id: string): Promise<Token | null> => {
    try {
        const { data, error } = await supabase
            .from("tokens")
            .select("*")
            .eq("dao_id", id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error fetching token for DAO ${id}:`, error);
        return null;
    }
};

/**
 * Fetch token price and related data
 * @param dex DEX contract principal
 * @returns Token price data
 */
export const fetchTokenPrice = async (
    dex: string
): Promise<TokenPriceResponse> => {
    try {
        const { data } = await sdkFaktory.getToken(dex);
        return {
            price: data.priceUsd ? Number(data.priceUsd) : 0,
            marketCap: data.marketCap ? Number(data.marketCap) : 0,
            holders: data.holders ? Number(data.holders) : 0,
            price24hChanges: data.price24hChanges ? Number(data.price24hChanges) : null,
        };
    } catch (error) {
        console.error(`Error fetching token price for DEX ${dex}:`, error);
        return {
            price: 0,
            marketCap: 0,
            holders: 0,
            price24hChanges: null,
        };
    }
};

/**
 * Fetch token trades history
 * @param tokenContract Token contract principal
 * @returns Array of token trades
 */
export const fetchTokenTrades = async (
    tokenContract: string
): Promise<TokenTrade[]> => {
    try {
        const { data } = await sdkFaktory.getTokenTrades(tokenContract);
        return data || [];
    } catch (error) {
        console.error(`Error fetching token trades for ${tokenContract}:`, error);
        return [];
    }
};

/**
 * Fetch token prices for multiple DAOs
 * @param daos Array of DAOs
 * @param tokens Array of tokens
 * @returns Record of token prices by DAO ID
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

            if (extension && token) {
                try {
                    const priceData = await fetchTokenPrice(extension.contract_principal!);
                    prices[dao.id] = priceData;
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
 * Fetch extensions for a specific DAO
 * @param id DAO ID
 * @returns Array of extensions
 */
export const fetchDAOExtensions = async (id: string): Promise<Extension[]> => {
    try {
        const { data, error } = await supabase
            .from("extensions")
            .select("*")
            .eq("dao_id", id);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`Error fetching extensions for DAO ${id}:`, error);
        return [];
    }
};

/**
 * Fetch token holders
 * @param contractPrincipal Contract principal
 * @param tokenSymbol Token symbol
 * @returns Holders data
 */
export const fetchHolders = async (
    contractPrincipal: string,
    tokenSymbol: string
): Promise<{ holders: Holder[]; totalSupply: number; holderCount: number }> => {
    try {
        const response = await fetch(
            `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/tokens/ft/${contractPrincipal}::${tokenSymbol}/holders`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch holders: ${response.statusText}`);
        }

        const data: HiroHolderResponse = await response.json();

        const holdersWithPercentage = data.results.map((holder) => ({
            ...holder,
            percentage: (Number(holder.balance) / Number(data.total_supply)) * 100,
        }));

        return {
            holders: holdersWithPercentage,
            totalSupply: Number(data.total_supply),
            holderCount: data.total,
        };
    } catch (error) {
        console.error("Error fetching holders:", error);
        return { holders: [], totalSupply: 0, holderCount: 0 };
    }
};

/**
 * Fetch STX balance for a treasury
 * @param treasuryAddress Treasury address
 * @returns STX token data or null
 */
export const fetchSTXBalance = async (
    treasuryAddress: string
): Promise<TreasuryToken | null> => {
    try {
        const response = await fetch(
            `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/address/${treasuryAddress}/balances`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch STX balance: ${response.statusText}`);
        }

        const data = (await response.json()) as HiroBalanceResponse;

        if (data.stx && Number(data.stx.balance) > 0) {
            const amount = Number(data.stx.balance) / 1_000_000;
            return {
                type: "FT",
                name: "Stacks",
                symbol: "STX",
                amount,
                value: 0, // Value will be calculated later
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching STX balance:", error);
        return null;
    }
};

/**
 * Fetch fungible tokens for a treasury
 * @param treasuryAddress Treasury address
 * @param balanceData Balance data
 * @returns Array of fungible tokens
 */
export const fetchFungibleTokens = (
    balanceData: HiroBalanceResponse
): TreasuryToken[] => {
    try {
        const tokens: TreasuryToken[] = [];

        for (const [assetIdentifier, tokenData] of Object.entries(
            balanceData.fungible_tokens
        )) {
            const [, tokenInfo] = assetIdentifier.split("::");
            const amount = Number(tokenData.balance) / 1_000_000;

            tokens.push({
                type: "FT",
                name: tokenInfo || assetIdentifier,
                symbol: tokenInfo || "",
                amount,
                value: 0, // Value will be calculated later
            });
        }

        return tokens;
    } catch (error) {
        console.error("Error processing fungible tokens:", error);
        return [];
    }
};

/**
 * Fetch non-fungible tokens for a treasury
 * @param balanceData Balance data
 * @returns Array of non-fungible tokens
 */
export const fetchNonFungibleTokens = (
    balanceData: HiroBalanceResponse
): TreasuryToken[] => {
    try {
        const tokens: TreasuryToken[] = [];

        for (const [assetIdentifier] of Object.entries(
            balanceData.non_fungible_tokens
        )) {
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
    } catch (error) {
        console.error("Error processing non-fungible tokens:", error);
        return [];
    }
};

/**
 * Fetch all treasury tokens and calculate values
 * @param treasuryAddress Treasury address
 * @param tokenPrice Token price
 * @returns Array of treasury tokens with values
 */
export const fetchTreasuryTokens = async (
    treasuryAddress: string,
    tokenPrice: number
): Promise<TreasuryToken[]> => {
    try {
        const response = await fetch(
            `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/address/${treasuryAddress}/balances`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch treasury tokens: ${response.statusText}`);
        }

        const data = (await response.json()) as HiroBalanceResponse;

        // Process STX balance
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

        // Process fungible tokens
        const fungibleTokens = fetchFungibleTokens(data);
        tokens.push(
            ...fungibleTokens.map((token) => ({
                ...token,
                value: token.amount * tokenPrice,
            }))
        );

        // Process non-fungible tokens
        const nonFungibleTokens = fetchNonFungibleTokens(data);
        tokens.push(...nonFungibleTokens);

        return tokens;
    } catch (error) {
        console.error("Error fetching treasury tokens:", error);
        return [];
    }
};

/**
 * Fetch market statistics for a DAO
 * @param dex DEX contract principal
 * @param contractPrincipal Contract principal
 * @param tokenSymbol Token symbol
 * @param maxSupply Maximum token supply
 * @returns Market statistics
 */
export const fetchMarketStats = async (
    dex: string,
    contractPrincipal: string,
    tokenSymbol: string,
    maxSupply: number
): Promise<MarketStats> => {
    try {
        const [holdersData, tokenDetails] = await Promise.all([
            fetchHolders(contractPrincipal, tokenSymbol),
            fetchTokenPrice(dex),
        ]);

        const treasuryBalance = maxSupply * 0.8 * tokenDetails.price;

        return {
            price: tokenDetails.price,
            marketCap: tokenDetails.marketCap,
            treasuryBalance,
            holderCount: holdersData.holderCount || tokenDetails.holders,
        };
    } catch (error) {
        console.error("Error fetching market stats:", error);
        return {
            price: 0,
            marketCap: 0,
            treasuryBalance: 0,
            holderCount: 0,
        };
    }
};

/**
 * Fetch proposals for a DAO
 * @param daoId DAO ID
 * @returns Array of proposals
 */
export const fetchProposals = async (daoId: string): Promise<Proposal[]> => {
    try {
        const { data, error } = await supabase
            .from("proposals")
            .select("*")
            .eq("dao_id", daoId)
            .order("created_at", { ascending: false }); //newest first

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`Error fetching proposals for DAO ${daoId}:`, error);
        return [];
    }
};

/**
 * Fetch a DAO by name
 * @param encodedName URL-encoded DAO name
 * @returns DAO object or null
 */
export const fetchDAOByName = async (encodedName: string): Promise<DAO | null> => {
    try {
        // Decode the URL-encoded name
        const name = decodeURIComponent(encodedName);

        const { data, error } = await supabase
            .from("daos")
            .select("*")
            .eq("name", name)
            .eq("is_broadcasted", true)
            .single();

        if (error) {
            console.error(`Error fetching DAO with name ${name}:`, error);
            return null;
        }

        if (!data) {
            console.error("No DAO found with name:", name);
            return null;
        }

        return data;
    } catch (error) {
        console.error(`Error fetching DAO with name ${encodedName}:`, error);
        return null;
    }
};
