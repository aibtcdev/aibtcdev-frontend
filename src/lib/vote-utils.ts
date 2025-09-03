// Helper function to format votes with appropriate suffixes
export function formatVotes(votes: number): string {
  if (isNaN(votes)) throw new Error("Invalid vote value: NaN");
  if (votes === 0) return "0";

  // Simply return the number divided by 1e8 as requested
  return (votes / 1e8).toString();
}

const url =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
    ? process.env.NEXT_PUBLIC_CACHE_URL_TESTNET
    : process.env.NEXT_PUBLIC_CACHE_URL;

export async function getProposalVotes(
  contractPrincipal: string,
  proposalId: number,
  bustCache = false
) {
  // Parse the contract principal to extract address and name
  const [contractAddress, contractName] = contractPrincipal.split(".");

  if (!contractAddress || !contractName) {
    throw new Error("Invalid contract principal format");
  }

  try {
    // Call the endpoint with POST method and the correct request body format
    const response = await fetch(
      `${url}/contract-calls/read-only/${contractAddress}/${contractName}/get-proposal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          functionArgs: [
            {
              type: "uint",
              value: proposalId.toString(),
            },
          ],
          network:
            process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
              ? "mainnet"
              : "testnet",
          // Add cache control in the request body
          cacheControl: bustCache
            ? {
                bustCache: true, // Force a fresh request
                ttl: 3600, // Cache for 1 hour
              }
            : undefined,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();

    // Check if the data is nested inside a data property
    const voteData = responseData.data || responseData;

    if (!voteData) {
      throw new Error("No vote data returned from API");
    }

    // Validate that we have the required vote fields
    const votesFor = voteData.votesFor;
    const votesAgainst = voteData.votesAgainst;
    const liquidTokens = voteData.liquidTokens;

    if (votesFor === undefined || votesAgainst === undefined) {
      throw new Error("Invalid vote data structure - missing vote fields");
    }

    return {
      ...responseData,
      votesFor: votesFor,
      votesAgainst: votesAgainst,
      liquidTokens: liquidTokens,
      fetchedAt: Date.now(), // Add timestamp for debugging
      wasCacheBusted: bustCache,
    };
  } catch (error) {
    // Re-throw with more context
    throw new Error(
      `Failed to fetch proposal votes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
