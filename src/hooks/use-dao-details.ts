import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Extension, DAO, Holder, Token } from "@/types/supabase";
import { sdkFaktory } from "@/lib/faktory-fun";

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

const daoCache = new Map<string, {
    data: {
        dao: DAO | null;
        daoExtensions: Extension[] | null;
        holders: Holder[];
        tokenSymbol: string;
        token: Token;
        marketStats: MarketStats;
        treasuryTokens: TreasuryToken[];
    };
    timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds


export function useDAODetails(id: string) {
    const [dao, setDAO] = useState<DAO | null>(null);
    const [daoExtensions, setDAOExtensions] = useState<Extension[] | null>(null);
    const [holders, setHolders] = useState<Holder[]>([]);
    const [tokenSymbol, setTokenSymbol] = useState<string>("");
    const [token, setToken] = useState<Token>({
        id: "0",
        dao_id: "0",
        contract_principal: "",
        name: "",
        symbol: "",
        decimals: 0,
        image_url: "",
        max_supply: 10000000,
    });
    const [marketStats, setMarketStats] = useState<MarketStats>({
        price: 0,
        marketCap: 0,
        treasuryBalance: 0,
        holderCount: 0,
    });
    const [treasuryTokens, setTreasuryTokens] = useState<TreasuryToken[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHolders = async (contractPrincipal: string, tokenSymbol: string) => {
        try {
            const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
            const response = await fetch(
                `https://api.${network}.hiro.so/extended/v1/tokens/ft/${contractPrincipal}::${tokenSymbol}/holders`
            );
            const data: HiroHolderResponse = await response.json();

            const holdersWithPercentage = data.results.map((holder) => ({
                ...holder,
                percentage: (Number(holder.balance) / Number(data.total_supply)) * 100,
            }));

            return {
                holders: holdersWithPercentage,
                totalSupply: Number(data.total_supply),
                holderCount: data.total
            };
        } catch (error) {
            console.error("Error fetching holders:", error);
            return { holders: [], totalSupply: 0, holderCount: 0 };
        }
    };

    const fetchTokenPrice = async (dex: string) => {
        try {
            const { data } = await sdkFaktory.getToken(dex);
            const priceUsd = data.priceUsd ? Number(data.priceUsd) : 0;
            // console.log('Token price fetched:', priceUsd);
            return {
                priceUsd,
                marketCap: data.marketCap ? Number(data.marketCap) : 0,
                holders: data.holders ? Number(data.holders) : 0
            };
        } catch (error) {
            console.error("Error fetching token price:", error);
            return { priceUsd: 0, marketCap: 0, holders: 0 };
        }
    };

    const fetchTreasuryTokens = async (treasuryAddress: string, tokenPrice: number) => {
        try {
            // console.log('Treasury tokens fetch started with price:', tokenPrice);
            const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
            const response = await fetch(
                `https://api.${network}.hiro.so/extended/v1/address/${treasuryAddress}/balances`
            );
            const data = (await response.json()) as HiroBalanceResponse;

            const tokens: TreasuryToken[] = [];

            if (data.stx && Number(data.stx.balance) > 0) {
                const amount = Number(data.stx.balance) / 1_000_000;
                const value = amount * tokenPrice;
                tokens.push({
                    type: 'FT',
                    name: 'Stacks',
                    symbol: 'STX',
                    amount,
                    value
                });
                // console.log('STX token processed:', { amount, tokenPrice, value });
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
                // console.log('FT token processed:', tokenInfo, { amount, tokenPrice, value });
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

            // console.log('Final treasury tokens:', tokens);
            return tokens;
        } catch (error) {
            console.error("Error fetching treasury tokens:", error);
            return [];
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            const cachedData = daoCache.get(id);
            const now = Date.now();

            if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
                if (!isMounted) return;
                setDAO(cachedData.data.dao);
                setDAOExtensions(cachedData.data.daoExtensions);
                setHolders(cachedData.data.holders);
                setTokenSymbol(cachedData.data.tokenSymbol);
                setToken(cachedData.data.token);
                setMarketStats(cachedData.data.marketStats);
                setTreasuryTokens(cachedData.data.treasuryTokens);
                setLoading(false);
                return;
            }

            try {
                const { data: daoData, error: daoError } = await supabase
                    .from("daos")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (daoError) throw daoError;
                if (!isMounted) return;
                setDAO(daoData);

                const { data: extensionsData, error: extensionsError } = await supabase
                    .from("extensions")
                    .select("*")
                    .eq("dao_id", id);

                if (extensionsError) throw extensionsError;
                if (!isMounted) return;
                setDAOExtensions(extensionsData);

                const { data: tokensData, error: tokensError } = await supabase
                    .from("tokens")
                    .select("*")
                    .eq("dao_id", id);

                if (tokensError) throw tokensError;

                if (tokensData && tokensData.length > 0) {
                    const currentToken = tokensData[0];
                    if (!isMounted) return;
                    setToken(currentToken);
                    setTokenSymbol(currentToken.symbol);

                    const dex = extensionsData.find(
                        (extension) => extension.type === "dex"
                    )?.contract_principal;

                    if (!dex) throw new Error("No DEX contract found");

                    const [holdersData, tokenDetails] = await Promise.all([
                        fetchHolders(currentToken.contract_principal, currentToken.symbol),
                        fetchTokenPrice(dex)
                    ]);

                    const treasuryAddr = extensionsData.find(
                        (extension) => extension.type === "aibtc-treasury"
                    )?.contract_principal;

                    if (!treasuryAddr) throw new Error("No treasury address found");

                    const treasuryTokensList = await fetchTreasuryTokens(treasuryAddr, tokenDetails.priceUsd);
                    if (!isMounted) return;

                    setHolders(holdersData.holders);
                    setTreasuryTokens(treasuryTokensList);

                    const treasuryBalance = (currentToken.max_supply || 0) * 0.8 * tokenDetails.priceUsd;

                    const newMarketStats = {
                        price: tokenDetails.priceUsd,
                        marketCap: tokenDetails.marketCap,
                        treasuryBalance,
                        holderCount: holdersData.holderCount || tokenDetails.holders,
                    };

                    setMarketStats(newMarketStats);

                    daoCache.set(id, {
                        data: {
                            dao: daoData,
                            daoExtensions: extensionsData,
                            holders: holdersData.holders,
                            tokenSymbol: currentToken.symbol,
                            token: currentToken,
                            marketStats: newMarketStats,
                            treasuryTokens: treasuryTokensList,
                        },
                        timestamp: now,
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    return {
        dao,
        daoExtensions,
        holders,
        tokenSymbol,
        token,
        marketStats,
        treasuryTokens,
        loading,
    };
}