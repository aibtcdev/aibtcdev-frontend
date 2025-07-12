import { getLocalStorage, StorageData } from "@stacks/connect";

interface AddressEntry {
  symbol?: string;
  address: string;
  publicKey: string;
}

interface AddressObject extends Omit<AddressEntry, "publicKey"> {
  type?: string;
  tweakedPublicKey?: string;
  derivationPath?: string;
  purpose?: string;
  addressType?: string;
  walletType?: string;
}

export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = getLocalStorage() as StorageData | null;
    if (!data) {
      return null;
    }
    console.log(data);
    const stxList = data.addresses.stx as AddressObject[];
    const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
    const preferred = stxList.find((addr) =>
      isTestnet ? addr.address.startsWith("ST") : addr.address.startsWith("SP")
    );
    return preferred?.address || stxList[0]?.address || null;
  } catch (error) {
    console.error("Error getting Stacks address from local storage:", error);
    return null;
  }
}

export function getBitcoinAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = getLocalStorage() as StorageData | null;
    if (!data) {
      return null;
    }
    const btcList = data.addresses.btc as AddressObject[];
    if (btcList.length === 0) return null;
    // Prefer segwit then taproot
    const preferred =
      btcList.find((addr) => addr.type === "p2wpkh") ||
      btcList.find((addr) => addr.type === "p2tr") ||
      btcList[0];
    return preferred.address;
  } catch (error) {
    console.error("Error getting Bitcoin address:", error);
    return null;
  }
}
