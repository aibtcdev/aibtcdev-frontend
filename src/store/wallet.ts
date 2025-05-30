import { create } from "zustand"
import type { Wallet, Agent } from "@/types/supabase"
import { fetchWallets as fetchWalletsQuery, fetchWalletBalance, fetchWalletBalances } from "@/queries/wallet-queries"

export interface TokenBalance {
    balance: string
    total_sent: string
    total_received: string
}

interface NFTBalance {
    count: number
    total_sent: number
    total_received: number
}

export interface WalletBalance {
    stx: TokenBalance
    fungible_tokens: {
        [key: string]: TokenBalance
    }
    non_fungible_tokens: {
        [key: string]: NFTBalance
    }
}

export interface WalletWithAgent extends Wallet {
    agent?: Agent
}

interface WalletState {
    balances: Record<string, WalletBalance>
    userWallet: WalletWithAgent | null
    agentWallets: WalletWithAgent[]
    isLoading: boolean
    error: string | null
    fetchBalances: (addresses: string[]) => Promise<void>
    fetchSingleBalance: (address: string) => Promise<WalletBalance | null>
    fetchWallets: (userId: string | null) => Promise<void>
}

export const useWalletStore = create<WalletState>((set, get) => ({
    balances: {},
    userWallet: null,
    agentWallets: [],
    isLoading: false,
    error: null,

    fetchWallets: async (userId: string | null) => {
        if (!userId) {
            set({
                userWallet: null,
                agentWallets: [],
                isLoading: false,
            })
            return
        }

        try {
            set({ isLoading: true, error: null })

            // Use the query function from walletQueries.ts
            const walletsData = await fetchWalletsQuery(userId)

            // Separate user wallet (agent_id is null) from agent wallets
            const userWallet = walletsData?.find((wallet) => wallet.agent_id === null) || null
            const agentWallets = walletsData?.filter((wallet) => wallet.agent_id !== null) || []
            console.log("All wallets fetched:", walletsData)
            console.log("User wallet:", userWallet)
            console.log("Agent wallets:", agentWallets)

            // Fetch balances for all addresses
            const allAddresses = walletsData
                ?.map((wallet) =>
                    process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet" ? wallet.mainnet_address : wallet.testnet_address,
                )
                .filter((address): address is string => address !== null)

            if (allAddresses && allAddresses.length > 0) {
                await get().fetchBalances(allAddresses)
            }

            set({
                userWallet,
                agentWallets,
                isLoading: false,
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch wallets",
                isLoading: false,
            })
        }
    },

    fetchSingleBalance: async (address: string) => {
        try {
            set({ isLoading: true, error: null })

            // Use the query function from walletQueries.ts
            const data = await fetchWalletBalance(address)

            // Update the balances state with the new balance
            set((state) => ({
                balances: {
                    ...state.balances,
                    [address]: data,
                },
                isLoading: false,
            }))

            return data
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : `Failed to fetch balance for ${address}`,
                isLoading: false,
            })
            return null
        }
    },

    fetchBalances: async (addresses) => {
        try {
            set({ isLoading: true, error: null })

            // Use the query function from walletQueries.ts
            const newBalances = await fetchWalletBalances(addresses)

            set((state) => ({
                balances: {
                    ...state.balances,
                    ...newBalances,
                },
                isLoading: false,
            }))
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch balances",
                isLoading: false,
            })
        }
    },
}))
