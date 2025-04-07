import { create } from "zustand"
import { supabase } from "@/utils/supabase/client"
import type { Wallet, Agent } from "@/types/supabase"

export interface TokenBalance {
    balance: string
    total_sent: string
    total_received: string
}

export interface NFTBalance {
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
    _lastFetched?: number
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
    fetchWallets: (userId: string) => Promise<void>
}

export const useWalletStore = create<WalletState>((set, get) => ({
    balances: {},
    userWallet: null,
    agentWallets: [],
    isLoading: false,
    error: null,

    fetchWallets: async (userId: string) => {
        try {
            set({ isLoading: true, error: null })

            const { data: walletsData, error: walletsError } = await supabase
                .from("wallets")
                .select("*, agent:agents(*)")
                .eq("profile_id", userId)

            if (walletsError) {
                throw walletsError
            }

            // Separate user wallet (agent_id is null) from agent wallets
            const userWallet = walletsData?.find((wallet) => wallet.agent_id === null) || null
            const agentWallets = walletsData?.filter((wallet) => wallet.agent_id !== null) || []

            // Fetch balances for all addresses
            // if NEXT_PUBLIC_STACKS_NETWORK is mainnet, use mainnet_address, otherwise use testnet_address
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
            // Check if we already have this balance in the cache
            const existingBalance = get().balances[address]
            if (existingBalance) {
                // If we have it and it's less than 2 minutes old, just return it
                const now = Date.now()
                const lastFetched = existingBalance._lastFetched || 0
                if (now - lastFetched < 2 * 60 * 1000) {
                    return existingBalance
                }
            }

            set({ isLoading: true, error: null })

            const network = process.env.NEXT_PUBLIC_STACKS_NETWORK
            const response = await fetch(`https://api.${network}.hiro.so/extended/v1/address/${address}/balances`)

            if (!response.ok) {
                throw new Error(`Failed to fetch balance for ${address}`)
            }

            const data = (await response.json()) as WalletBalance

            // Add a timestamp to the data
            const dataWithTimestamp = {
                ...data,
                _lastFetched: Date.now(),
            }

            // Update the balances state with the new balance
            set((state) => ({
                balances: {
                    ...state.balances,
                    [address]: dataWithTimestamp,
                },
                isLoading: false,
            }))

            return dataWithTimestamp
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
            // Check which addresses we need to fetch
            const currentBalances = get().balances
            const now = Date.now()
            const addressesToFetch = addresses.filter((address) => {
                const balance = currentBalances[address]
                if (!balance) return true
                const lastFetched = balance._lastFetched || 0
                return now - lastFetched >= 2 * 60 * 1000 // Fetch if older than 2 minutes
            })

            if (addressesToFetch.length === 0) {
                // All balances are fresh enough, no need to fetch
                return
            }

            set({ isLoading: true, error: null })

            const balancePromises = addressesToFetch.map(async (address) => {
                const network = process.env.NEXT_PUBLIC_STACKS_NETWORK
                const response = await fetch(`https://api.${network}.hiro.so/extended/v1/address/${address}/balances`)
                if (!response.ok) {
                    throw new Error(`Failed to fetch balance for ${address}`)
                }
                const data = await response.json()
                return [address, { ...data, _lastFetched: now }] as [string, WalletBalance]
            })

            const results = await Promise.all(balancePromises)
            const newBalances = Object.fromEntries(results)

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
