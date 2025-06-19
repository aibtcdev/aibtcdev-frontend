import { getLocalStorage } from "@stacks/connect";

interface AddressObject {
  symbol?: string;
  address: string;
  type?: string;
  addressType?: string;
  purpose?: string;
  walletType?: string;
  publicKey?: string;
  tweakedPublicKey?: string;
  derivationPath?: string;
}

interface LeatherStorage {
  STX_PROVIDER: "LeatherProvider";
  addresses: AddressObject[];
}

interface XverseStorage {
  STX_PROVIDER: "XverseProviders.BitcoinProvider";
  addresses: {
    stx: AddressObject[];
    btc: AddressObject[];
  };
}

type LocalStoragePayload = LeatherStorage | XverseStorage;

function isLeatherStorage(data: LocalStoragePayload): data is LeatherStorage {
  return data.STX_PROVIDER === "LeatherProvider";
}

function isXverseStorage(data: LocalStoragePayload): data is XverseStorage {
  return data.STX_PROVIDER === "XverseProviders.BitcoinProvider";
}

export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = getLocalStorage() as LocalStoragePayload | null;
    if (!data) {
      return null;
    }

    let stxAddressObj: AddressObject | undefined;

    // LeatherProvider returns a flat addresses array
    if (isLeatherStorage(data)) {
      stxAddressObj = data.addresses.find((addr) => addr.symbol === "STX");
    } else if (isXverseStorage(data)) {
      stxAddressObj = data.addresses.stx.find(
        (addr) => addr.addressType === "stacks" || addr.symbol === "STX"
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
    const data = getLocalStorage() as LocalStoragePayload | null;
    if (!data) {
      return null;
    }

    let btcList: AddressObject[] = [];

    // LeatherProvider returns a flat addresses array
    if (isLeatherStorage(data)) {
      btcList = data.addresses.filter((addr) => addr.symbol === "BTC");
    } else if (isXverseStorage(data)) {
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
