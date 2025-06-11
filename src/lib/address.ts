export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const blockstackSession = JSON.parse(
    localStorage.getItem("blockstack-session") || "{}"
  );

  const address =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
      ? blockstackSession.userData?.profile?.stxAddress?.mainnet
      : blockstackSession.userData?.profile?.stxAddress?.testnet;

  return address || null;
}

export function getBitcoinAddress(
  network: "mainnet" | "testnet" = "mainnet"
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const blockstackSession = JSON.parse(
    localStorage.getItem("blockstack-session") || "{}"
  );
  const btcAddress = blockstackSession.userData?.profile?.btcAddress;

  if (!btcAddress) {
    // Check if there's a stored address in localStorage as fallback
    const storedBtcAddress = localStorage.getItem("btcAddress");
    return storedBtcAddress || null;
  }

  // Handle Leather wallet's structured address format
  if (typeof btcAddress === "object") {
    // Leather wallet stores addresses in a structured object
    if (network === "mainnet") {
      // Try p2wpkh (segwit) first, then p2tr (taproot), then p2pkh (legacy)
      return (
        btcAddress.p2wpkh?.mainnet ||
        btcAddress.p2tr?.mainnet ||
        btcAddress.p2pkh?.mainnet ||
        null
      );
    } else {
      // For testnet, try the same address types but for testnet
      return (
        btcAddress.p2wpkh?.testnet ||
        btcAddress.p2tr?.testnet ||
        btcAddress.p2pkh?.testnet ||
        null
      );
    }
  }

  return typeof btcAddress === "string" ? btcAddress : null;
}
