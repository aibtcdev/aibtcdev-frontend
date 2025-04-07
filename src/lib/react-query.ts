import { QueryClient } from "@tanstack/react-query"
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
    // DAO related query keys
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

    // Agent related query keys
    agents: "agents",
    agent: (id: string) => ["agent", id],
    agentsByProfile: (profileId: string) => ["agents", "profile", profileId],
    agentWallets: (agentId: string) => ["agent-wallets", agentId],
    agentBalance: (address: string) => ["agent-balance", address],
    agentTasks: (agentId: string) => ["agent-tasks", agentId],
    agentJobs: (agentId: string) => ["agent-jobs", agentId],
    agentPrompts: "agent-prompts",
    agentPromptsByDao: (daoId: string) => ["agent-prompts", "dao", daoId],
    agentPromptsByAgent: (agentId: string) => ["agent-prompts", "agent", agentId],
    agentTools: "agent-tools",

    // Wallet related query keys
    walletTokens: "wallet-tokens",
    walletTokensByDao: (daoId: string) => ["wallet-tokens", "dao", daoId],
    walletTokensByWallet: (walletId: string) => ["wallet-tokens", "wallet", walletId],

    // Vote related query keys
    votes: "votes",
    votesByProposal: (proposalId: string) => ["votes", "proposal", proposalId],
}

