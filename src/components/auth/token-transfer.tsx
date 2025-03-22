"use client";
import { openContractCall, type ContractCallOptions } from "@stacks/connect";
import {
  uintCV,
  principalCV,
  noneCV,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo,
  PostConditionMode,
} from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import { Button } from "@/components/ui/button";
import { userSession } from "@/lib/userSession";

interface TokenTransferProps {
  network: "mainnet" | "testnet";
  amount: number;
  recipient: string;
  contractAddress: string;
  contractName: string;
  token: string;
  buttonText?: string;
  onSuccess?: () => void;
}

export function TokenTransfer({
  network,
  amount,
  recipient,
  contractAddress,
  contractName,
  token,
  buttonText = "Transfer Tokens",
  onSuccess,
}: TokenTransferProps) {
  const transferToken = async () => {
    const stacksNetwork =
      process.env.NEXT_PUBLIC_STACKS_NETWORK == "mainnet"
        ? new StacksMainnet()
        : new StacksTestnet();

    const sender = userSession.loadUserData().profile.stxAddress[network];

    // Create proper asset info for the token
    const assetInfo = createAssetInfo(contractAddress, contractName, token);

    // Create FT post condition using the proper function
    const ftPostCondition = makeStandardFungiblePostCondition(
      sender,
      FungibleConditionCode.Equal,
      BigInt(amount),
      assetInfo
    );

    const options: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs: [
        uintCV(amount),
        principalCV(sender),
        principalCV(recipient),
        noneCV(),
      ],
      network: stacksNetwork,
      postConditions: [ftPostCondition],
      postConditionMode: PostConditionMode.Deny,
      appDetails: {
        name: "AIBTC",
        icon: "https://bncytzyfafclmdxrwpgq.supabase.co/storage/v1/object/public/aibtcdev/aibtcdev-avatar-250px.png",
      },
    };

    try {
      await openContractCall(options);
      console.log("Transfer initiated successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error initiating transfer:", error);
    }
  };

  return (
    <Button onClick={transferToken} className="w-full md:w-auto">
      {buttonText}
    </Button>
  );
}
