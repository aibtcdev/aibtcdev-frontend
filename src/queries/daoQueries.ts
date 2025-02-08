import { supabase } from "@/utils/supabase/client";
import { sdkFaktory } from "@/lib/faktory-fun";
import type { DAO, Holder, Token, Proposal, Extension } from "@/types/supabase";

interface MarketStats {
    price: number;
    marketCap: number;
    treasuryBalance: number;
    holderCount: number;
}

interface TreasuryToken {
    type: 'FT' | 'NFT';
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

const STACKS_NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK;

export const fetchXUsers = async () => {
    const { data, error } = await supabase
        .from("x_users")
        .select("id, user_id");

    if (error) throw error;
    return data || [];
};

export const fetchExtensions = async () => {
    const { data, error } = await supabase
        .from("extensions")
        .select("*");

    if (error) throw error;
    return data || [];
};

export const fetchDAOs = async (): Promise<DAO[]> => {
    const [{ data: daosData, error: daosError }, xUsersData, extensionsData] =
        await Promise.all([
            supabase.from("daos").select("*").order("created_at", { ascending: false }).eq("is_broadcasted", true),
            fetchXUsers(),
            fetchExtensions()
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
};

export const fetchDAO = async (id: string): Promise<DAO> => {
    const { data, error } = await supabase
        .from("daos")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
};

export const fetchTokens = async (): Promise<Token[]> => {
    const { data, error } = await supabase.from("tokens").select("*");
    if (error) throw error;
    return data || [];
};

export const fetchToken = async (id: string): Promise<Token> => {
    const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("dao_id", id)
        .single();

    if (error) throw error;
    return data;
};

export const fetchTokenPrice = async (
    dex: string
): Promise<{ price: number; marketCap: number; holders: number; price24hChanges: number | null }> => {
    const { data } = await sdkFaktory.getToken(dex);
    return {
        price: data.priceUsd ? Number(data.priceUsd) : 0,
        marketCap: data.marketCap ? Number(data.marketCap) : 0,
        holders: data.holders ? Number(data.holders) : 0,
        price24hChanges: data.price24hChanges ? Number(data.price24hChanges) : null,
    };
};

export const fetchTokenTrades = async (tokenContract: string): Promise<TokenTrade[]> => {
    const { data } = await sdkFaktory.getTokenTrades(tokenContract);
    return data || [];
};

export const fetchTokenPrices = async (
    daos: DAO[],
    tokens: Token[]
): Promise<Record<string, { price: number; marketCap: number; holders: number; price24hChanges: number | null }>> => {
    const prices: Record<string, { price: number; marketCap: number; holders: number; price24hChanges: number | null }> = {};

    await Promise.all(
        daos.map(async (dao) => {
            const extension = dao.extensions?.find((ext) => ext.type === "dex");
            const token = tokens?.find((t) => t.dao_id === dao.id);

            if (extension && token) {
                try {
                    const { data } = await sdkFaktory.getToken(extension.contract_principal!);
                    console.log(data)
                    prices[dao.id] = {
                        price: data.priceUsd ? Number(data.priceUsd) : 0,
                        marketCap: data.marketCap ? Number(data.marketCap) : 0,
                        holders: data.holders ? Number(data.holders) : 0,
                        price24hChanges: data.price24hChanges ? Number(data.price24hChanges) : null,
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

export const fetchDAOExtensions = async (id: string): Promise<Extension[]> => {
    const { data, error } = await supabase.from("extensions").select("*").eq("dao_id", id)
    if (error) throw error
    return data
}

export const fetchHolders = async (
    contractPrincipal: string,
    tokenSymbol: string
): Promise<{ holders: Holder[]; totalSupply: number; holderCount: number }> => {
    const response = await fetch(
        `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/tokens/ft/${contractPrincipal}::${tokenSymbol}/holders`
    );
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
};

export const fetchTreasuryTokens = async (
    treasuryAddress: string,
    tokenPrice: number
): Promise<TreasuryToken[]> => {
    const response = await fetch(
        `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/address/${treasuryAddress}/balances`
    );
    const data = await response.json() as HiroBalanceResponse;
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

    for (const [assetIdentifier, tokenData] of Object.entries(data.fungible_tokens)) {
        const [, tokenInfo] = assetIdentifier.split('::');
        const amount = Number(tokenData.balance) / 1_000_000;
        const value = amount * tokenPrice;
        tokens.push({
            type: 'FT',
            name: tokenInfo || assetIdentifier,
            symbol: tokenInfo || '',
            amount,
            value
        });
    }

    for (const [assetIdentifier] of Object.entries(data.non_fungible_tokens)) {
        const [, nftInfo] = assetIdentifier.split('::');
        tokens.push({
            type: 'NFT',
            name: nftInfo || assetIdentifier,
            symbol: nftInfo || '',
            amount: 1,
            value: 0
        });
    }

    return tokens;
};

export const fetchMarketStats = async (
    dex: string,
    contractPrincipal: string,
    tokenSymbol: string,
    maxSupply: number
): Promise<MarketStats> => {
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
};

export const fetchProposals = async (daoId: string): Promise<Proposal[]> => {
    const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("dao_id", daoId);

    if (error) throw error;
    return data || [];
};