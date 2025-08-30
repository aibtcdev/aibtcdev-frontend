// Helper function to format votes with appropriate suffixes
export function formatVotes(votes: number): string {
  if (isNaN(votes)) return "0";
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
    throw new Error(`Failed to fetch proposal votes: ${errorText}`);
  }

  const responseData = await response.json();

  // Check if the data is nested inside a data property
  const voteData = responseData.data || responseData;

  if (!voteData) {
    // Return null values instead of "0" to indicate data unavailable
    return {
      ...responseData,
      votesFor: null,
      votesAgainst: null,
      formattedVotesFor: null,
      formattedVotesAgainst: null,
      error: "Vote data not available",
    };
  }

  // Check if we got stale cached data with "0" values when we expect real data
  // If bustCache was requested but we still get "0", treat as potentially stale
  const votesFor = voteData.votesFor;
  const votesAgainst = voteData.votesAgainst;

  // If both votes are "0" and we're not busting cache, this might be stale data
  const isPotentiallyStale =
    !bustCache &&
    (votesFor === "0" || votesFor === 0) &&
    (votesAgainst === "0" || votesAgainst === 0);

  return {
    ...responseData,
    votesFor: votesFor,
    votesAgainst: votesAgainst,
    isPotentiallyStale, // Flag to indicate this might be stale cached data
  };
}
