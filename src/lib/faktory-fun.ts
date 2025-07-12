import FaktorySDK from "@faktoryfun/core-sdk";

export const sdkFaktory = new FaktorySDK({
  network:
    process.env.NEXT_PUBLIC_STACKS_NETWORK == "mainnet" ? "mainnet" : "testnet",
});
