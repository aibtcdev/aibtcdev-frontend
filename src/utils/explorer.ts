/**
 * Generates an explorer URL for a given address
 * @param address - The Stacks address to view in the explorer
 * @returns The complete explorer URL for the address
 */
export const getAddressExplorerUrl = (address: string): string => {
  const network =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? "testnet"
      : "mainnet";
  return `https://explorer.hiro.so/address/${address}?chain=${network}`;
};
