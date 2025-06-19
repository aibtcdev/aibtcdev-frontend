import { getLocalStorage } from "@stacks/connect";

interface AddressObject {
  symbol?: string;
  address: string;
  type?: string;
  addressType?: string;
  publicKey?: string;
  tweakedPublicKey?: string;
  derivationPath?: string;
}

export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = getLocalStorage();
    if (!data) {
      return null;
    }
    const provider = (data as any).STX_PROVIDER;

    let stxAddressObj: AddressObject | undefined;

    // LeatherProvider returns a flat addresses array
    if (
      provider === "LeatherProvider" &&
      Array.isArray((data as any).addresses)
    ) {
      stxAddressObj = (data as any).addresses.find(
        (addr: AddressObject) => addr.symbol === "STX"
      );
    }
    // XverseProvider stores addresses under data.addresses.stx
    else if (data.addresses && Array.isArray(data.addresses.stx)) {
      stxAddressObj = data.addresses.stx.find(
        (addr: AddressObject) =>
          addr.addressType === "stacks" || addr.symbol === "STX"
      );
    }

    return stxAddressObj?.address || null;
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
    if (!data) {
      return null;
    }
    const provider = (data as any).STX_PROVIDER;

    let btcList: AddressObject[] = [];

    // LeatherProvider returns a flat addresses array
    if (
      provider === "LeatherProvider" &&
      Array.isArray((data as any).addresses)
    ) {
      btcList = (data as any).addresses.filter(
        (addr: AddressObject) => addr.symbol === "BTC"
      );
    }
    // XverseProvider stores addresses under data.addresses.btc
    else if (data.addresses && Array.isArray(data.addresses.btc)) {
      btcList = data.addresses.btc;
    }

    if (btcList.length === 0) return null;

    // Prefer p2wpkh (segwit) first, then p2tr (taproot), then any BTC address
    const preferred =
      btcList.find((addr) => addr.type === "p2wpkh") ||
      btcList.find((addr) => addr.type === "p2tr") ||
      btcList[0];

    return preferred?.address || null;
  } catch (error) {
    console.error("Error getting Bitcoin address:", error);
    return null;
  }
}
