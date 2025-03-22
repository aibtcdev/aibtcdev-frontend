import { Cl, cvToJSON, callReadOnlyFunction } from "@stacks/transactions";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

export const runtime = "nodejs";

const network =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
    ? new StacksTestnet()
    : new StacksMainnet();

const senderAddress = "ST000000000000000000002AMW42H";

export async function fetchProposalVotes(
  contractAddress: string,
  contractName: string,
  proposalId: number
) {
  console.log("Fetching proposal votes...");
  // Fetch data
  const result = await callReadOnlyFunction({
    contractAddress: contractAddress,
    contractName: contractName,
    functionName: "get-proposal",
    functionArgs: [Cl.uint(proposalId)],
    senderAddress,
    network,
  });

  console.log(`result: ${JSON.stringify(result)}`);

  const jsonResult = cvToJSON(result);

  console.log(`jsonResult: ${JSON.stringify(jsonResult)}`);

  return jsonResult;
}
