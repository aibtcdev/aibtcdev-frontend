// NEW FILE: Centralized React Query configuration
import { QueryClient } from "@tanstack/react-query"

/**
 * Centralized query client configuration with optimized defaults
 * - staleTime: How long data remains fresh (5 minutes)
 * - gcTime: How long inactive data remains in cache (10 minutes)
 * - retry: Number of retry attempts for failed queries
 * - refetchOnWindowFocus: Disabled to prevent unnecessary refetches
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

/**
 * Centralized query keys to ensure consistency across components
 * This prevents duplicate queries and ensures proper cache invalidation
 */
export const queryKeys = {
    daos: "daos",
    dao: (name: string) => ["dao", name],
    daoById: (id: string) => ["dao-by-id", id],
    proposals: (daoId: string) => ["proposals", daoId],
    extensions: (daoId: string) => ["extensions", daoId],
    token: (daoId: string) => ["token", daoId],
    tokenPrice: (dex: string) => ["tokenPrice", dex],
    holders: (contractPrincipal: string, symbol: string) => ["holders", contractPrincipal, symbol],
    treasuryTokens: (treasuryAddress: string) => ["treasuryTokens", treasuryAddress],
    marketStats: (daoId: string) => ["marketStats", daoId],
    proposalVotes: (contractAddress: string, proposalId: string | number) => [
        "proposalVotes",
        contractAddress,
        proposalId,
    ],
}

