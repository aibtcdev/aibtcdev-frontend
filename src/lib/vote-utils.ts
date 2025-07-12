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
  console.log(url);
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
      // Use the required format for the request body
      body: JSON.stringify({
        functionArgs: [
          {
            type: "uint",
            value: proposalId.toString(),
          },
        ],
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

  // Parse the vote values to remove the "n" suffix and ensure they're valid numbers
  let votesFor = "0";
  let votesAgainst = "0";

  if (voteData.votesFor && typeof voteData.votesFor === "string") {
    votesFor = voteData.votesFor.replace(/n$/, "");
  }

  if (voteData.votesAgainst && typeof voteData.votesAgainst === "string") {
    votesAgainst = voteData.votesAgainst.replace(/n$/, "");
  }

  // Convert to numbers for calculations, defaulting to 0 if invalid
  const votesForNum = !isNaN(Number(votesFor)) ? Number(votesFor) : 0;
  const votesAgainstNum = !isNaN(Number(votesAgainst))
    ? Number(votesAgainst)
    : 0;

  // Create a result object with all the data and the formatted votes
  return {
    ...responseData,
    votesFor,
    votesAgainst,
    formattedVotesFor: (votesForNum / 1e8).toString(),
    formattedVotesAgainst: (votesAgainstNum / 1e8).toString(),
  };
}
