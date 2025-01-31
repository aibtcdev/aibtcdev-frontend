import { supabase } from "@/utils/supabase/client";
import { sdkFaktory } from "@/lib/faktory-fun";
import type { Extension, DAO, Holder, Token, Proposal } from "@/types/supabase";

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

export const fetchDAO = async (id: string): Promise<DAO> => {
    // console.log('Fetching DAO with ID:', id);
    const { data, error } = await supabase.from("daos").select("*").eq("id", id).single();
    if (error) {
        // console.error('Error fetching DAO:', error);
        throw error;
    }
    // console.log('Fetched DAO:', data);
    return data;
};

export const fetchDAOExtensions = async (id: string): Promise<Extension[]> => {
    // console.log('Fetching extensions for DAO ID:', id);
    const { data, error } = await supabase.from("extensions").select("*").eq("dao_id", id);
    if (error) {
        // console.error('Error fetching DAO extensions:', error);
        throw error;
    }
    // console.log('Fetched DAO extensions:', data);
    return data;
};

export const fetchToken = async (id: string): Promise<Token> => {
    // console.log('Fetching token for DAO ID:', id);
    const { data, error } = await supabase.from("tokens").select("*").eq("dao_id", id);
    if (error) {
        // console.error('Error fetching token:', error);
        throw error;
    }
    // console.log('Fetched token:', data[0]);
    return data[0];
};

export const fetchHolders = async (
    contractPrincipal: string,
    tokenSymbol: string,
): Promise<{ holders: Holder[]; totalSupply: number; holderCount: number }> => {
    // console.log(`Fetching holders for ${contractPrincipal}::${tokenSymbol}`);
    const response = await fetch(
        `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/tokens/ft/${contractPrincipal}::${tokenSymbol}/holders`,
    );
    const data: HiroHolderResponse = await response.json();
    // console.log('Raw holders response:', data);

    const holdersWithPercentage = data.results.map((holder: { address: string; balance: string }) => ({
        ...holder,
        percentage: (Number(holder.balance) / Number(data.total_supply)) * 100,
    }));


    // console.log(`Processed holders (${holdersWithPercentage.length} entries):`, holdersWithPercentage.slice(0, 3));
    // console.log(`Total supply: ${data.total_supply}, Holder count: ${data.total}`);

    return {
        holders: holdersWithPercentage,
        totalSupply: Number(data.total_supply),
        holderCount: data.total,
    };
};

export const fetchTokenPrice = async (
    dex: string,
): Promise<{ price: number; marketCap: number; holders: number; price24hChanges: number | null }> => {
    const { data } = await sdkFaktory.getToken(dex);
    return {
        price: data.priceUsd ? Number(data.priceUsd) : 0,
        marketCap: data.marketCap ? Number(data.marketCap) : 0,
        holders: data.holders ? Number(data.holders) : 0,
        price24hChanges: data.price24hChanges ? Number(data.price24hChanges) : null,
    };
};


export const fetchTreasuryTokens = async (treasuryAddress: string, tokenPrice: number): Promise<TreasuryToken[]> => {
    // console.log(`Fetching treasury tokens for address: ${treasuryAddress}`);
    const response = await fetch(`https://api.${STACKS_NETWORK}.hiro.so/extended/v1/address/${treasuryAddress}/balances`);
    const data = await response.json() as HiroBalanceResponse;
    // console.log('Raw treasury balance response:', data);

    const tokens: TreasuryToken[] = [];

    if (data.stx && Number(data.stx.balance) > 0) {
        const amount = Number(data.stx.balance) / 1_000_000;
        const value = amount * tokenPrice;
        // console.log(`Processed STX balance: ${amount} STX ($${value})`);
        tokens.push({
            type: "FT",
            name: "Stacks",
            symbol: "STX",
            amount,
            value,
        });
    }

    // console.log(`Processing ${Object.keys(data.fungible_tokens).length} FT tokens`);
    for (const [assetIdentifier, tokenData] of Object.entries(data.fungible_tokens)) {
        const [, tokenInfo] = assetIdentifier.split('::');
        const amount = Number(tokenData.balance) / 1_000_000;
        const value = amount * tokenPrice;
        // console.log(`Processing FT: ${assetIdentifier} = ${amount} tokens ($${value})`);
        tokens.push({
            type: 'FT',
            name: tokenInfo || assetIdentifier,
            symbol: tokenInfo || '',
            amount,
            value
        });
    }

    // console.log(`Processing ${Object.keys(data.non_fungible_tokens).length} NFT tokens`);
    for (const [assetIdentifier] of Object.entries(data.non_fungible_tokens)) {
        const [, nftInfo] = assetIdentifier.split('::');
        // console.log(`Processing NFT: ${assetIdentifier}`);
        tokens.push({
            type: 'NFT',
            name: nftInfo || assetIdentifier,
            symbol: nftInfo || '',
            amount: 1,
            value: 0
        });
    }

    // console.log('Final treasury tokens:', tokens);
    return tokens;
};

export const fetchMarketStats = async (
    dex: string,
    contractPrincipal: string,
    tokenSymbol: string,
    maxSupply: number,
): Promise<MarketStats> => {
    // console.log('Fetching market stats...');
    const [holdersData, tokenDetails] = await Promise.all([
        fetchHolders(contractPrincipal, tokenSymbol),
        fetchTokenPrice(dex),
    ]);

    // console.log('Holders data:', holdersData);
    // console.log('Token details:', tokenDetails);

    const treasuryBalance = maxSupply * 0.8 * tokenDetails.price;
    // console.log(`Calculated treasury balance: ${treasuryBalance} (using maxSupply: ${maxSupply})`);

    const stats = {
        price: tokenDetails.price,
        marketCap: tokenDetails.marketCap,
        treasuryBalance,
        holderCount: holdersData.holderCount || tokenDetails.holders,
    };
    // console.log('Final market stats:', stats);

    return stats;
};

export const fetchProposals = async (daoId: string): Promise<Proposal[]> => {
    // console.log("Fetching proposals for DAO ID:", daoId);
    const { data, error } = await supabase.from("proposals").select("*").eq("dao_id", daoId);

    if (error) {
        // console.error("Error fetching proposals:", error);
        throw error;
    }
    // console.log("Fetched proposals:", data);
    return data;
};

