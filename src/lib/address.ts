import { getLocalStorage } from "@stacks/connect";

interface AddressObject {
  symbol?: string;
  address: string;
  type?: string;
  addressType?: string;
}

export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = getLocalStorage();
    if (data?.addresses && Array.isArray(data.addresses)) {
      const stxAddressObj = data.addresses.find(
        // (addr: AddressObject) => addr.symbol === "STX"
        (addr: AddressObject) => addr.addressType === "stacks"
      );
      return stxAddressObj?.address || null;
    }
    return null;
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
    const data = getLocalStorage();
    if (data?.addresses && Array.isArray(data.addresses)) {
      const btcAddresses = data.addresses.filter(
        (addr: AddressObject) => addr.symbol === "BTC"
      );

      if (btcAddresses.length === 0) return null;

      // Prefer p2wpkh (segwit) first, then p2tr (taproot), then any BTC address
      const preferredAddress =
        btcAddresses.find((addr: AddressObject) => addr.type === "p2wpkh") ||
        btcAddresses.find((addr: AddressObject) => addr.type === "p2tr") ||
        btcAddresses[0];

      return preferredAddress?.address || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting Bitcoin address:", error);
    return null;
  }
}
