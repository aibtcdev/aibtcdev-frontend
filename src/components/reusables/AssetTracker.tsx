// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";
// import { formatBalance } from "@/lib/format";
// import { useWalletStore } from "@/store/wallet";
// import { getStacksAddress } from "@/lib/address";
// import Link from "next/link";
// import type { WalletBalance } from "@/store/wallet";

// const isFakeToken = (tokenId: string) => {
//   // Normalize a possible trailing colon from some indexers
//   const cleaned = tokenId.replace(/:$/, "");
//   const parts = cleaned.split("::");
//   const asset = parts[parts.length - 1];
//   // Accept only fake tokens
//   return asset === "fake";
// };

// const TokenTracker = () => {
//   const { balances, fetchSingleBalance } = useWalletStore();
//   const [agentSbtcStatus, setAgentSbtcStatus] = useState<
//     Record<string, number>
//   >({});
//   const [isLoaded, setIsLoaded] = useState(false);

//   // Function to find fake token balance in fungible tokens
//   const findFakeTokenBalance = (
//     fungibleTokens: WalletBalance["fungible_tokens"] | undefined
//   ) => {
//     if (!fungibleTokens) return 0;
//     for (const [tokenId, tokenData] of Object.entries(fungibleTokens)) {
//       if (isFakeToken(tokenId)) {
//         return Number(tokenData.balance || 0);
//       }
//     }
//     return 0;
//   };

//   // Memoize fetchData to prevent unnecessary recreations
//   const fetchData = useCallback(
//     async (address: string) => {
//       try {
//         await fetchSingleBalance(address);
//       } catch (err) {
//         console.error("Error fetching balance:", err);
//       }
//     },
//     [fetchSingleBalance]
//   );

//   // Check user's Stacks address for fake token balance
//   useEffect(() => {
//     const checkUserWallet = async () => {
//       setIsLoaded(false);
//       const address = getStacksAddress();
//       if (!address) {
//         console.log("No connected user Stacks address found");
//         setAgentSbtcStatus({});
//         setIsLoaded(true);
//         return;
//       }

//       try {
//         if (!balances[address]) {
//           console.log(`Fetching balance for user address: ${address}`);
//           await fetchData(address);
//         }

//         const fakeBalance = findFakeTokenBalance(
//           balances[address]?.fungible_tokens
//         );
//         setAgentSbtcStatus({ [address]: fakeBalance });
//         setIsLoaded(true);
//       } catch (err) {
//         console.error("Error checking user wallet:", err);
//         setAgentSbtcStatus({});
//         setIsLoaded(true);
//       }
//     };

//     checkUserWallet();
//     // Re-run when balances change for the current address
//   }, [balances, fetchData]);

//   // Check if any agent wallet has fake token balance > 0
//   const hasAnySbtc = Object.values(agentSbtcStatus).some(
//     (balance) => balance > 0
//   );

//   const fakeBalanceRaw = useMemo(() => {
//     const vals = Object.values(agentSbtcStatus);
//     return (vals.length > 0 && typeof vals[0] === "number") ? vals[0] : 0;
//   }, [agentSbtcStatus]);

//   const formattedFakeBalance = useMemo(() => formatBalance(fakeBalanceRaw, 8), [fakeBalanceRaw]);

//   // Only render content if user is logged in
//   return (
//     <div className="w-full max-w-2xl mx-auto my-4 bg-[#2A2A2A] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-zinc-800 p-4 flex items-center gap-3">
//       {/* Status Icon */}
//       <span className="flex-shrink-0">
//         {!isLoaded ? (
//           // Spinner
//           <svg
//             className="animate-spin h-6 w-6 text-zinc-400"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//               fill="none"
//             />
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//             />
//           </svg>
//         ) : hasAnySbtc ? (
//           // Bitcoin icon (replace with your icon set)
//           <svg
//             className="h-6 w-6 text-[#FF6B00]"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <circle
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="#FF6B00"
//               strokeWidth="2"
//               fill="#232323"
//             />
//             <text
//               x="12"
//               y="16"
//               textAnchor="middle"
//               fontSize="10"
//               fill="#FF6B00"
//               fontWeight="bold"
//             >
//               ₿
//             </text>
//           </svg>
//         ) : (
//           // Alert icon for no token
//           <svg
//             className="h-6 w-6 text-zinc-400"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <circle
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="2"
//               fill="#232323"
//             />
//             <path
//               d="M12 8v4m0 4h.01"
//               stroke="#FF6B00"
//               strokeWidth="2"
//               strokeLinecap="round"
//             />
//           </svg>
//         )}
//       </span>
//       <div className="flex-1">
//         {!isLoaded && (
//           <span className="text-zinc-400 text-sm">
//             Checking your connected wallet for the sBTC token...
//           </span>
//         )}
//         {isLoaded && hasAnySbtc && (
//           <span className="text-[#FF6B00] font-medium text-sm">
//             Your connected wallet holds {formattedFakeBalance} fake
//             tokens. Deposit your {formattedFakeBalance} fake tokens
//             into your agent voting account.
//           </span>
//         )}
//         {isLoaded && !hasAnySbtc && (
//           <span className="text-zinc-400 text-sm flex items-center gap-2">
//             Your connected wallet does not hold any fake tokens.
//             <Link href="/deposit" legacyBehavior>
//               <a className="ml-2 px-3 py-1 rounded bg-[#FF6B00] text-white text-xs font-semibold hover:bg-[#FF8533] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2">
//                 Deposit BTC
//               </a>
//             </Link>
//           </span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TokenTracker;
