import { supabase } from "./supabase";
import type { Vote } from "@/types";

/**
 * Raw vote data from Supabase with joined DAO and proposal information
 */
interface VoteWithRelations {
  id: string;
  created_at: string;
  dao_id: string;
  wallet_id: string | null;
  profile_id: string | null;
  answer: boolean;
  proposal_id: string;
  reasoning: string | null;
  evaluation: string | null;
  tx_id: string | null;
  address: string | null;
  amount: string | null;
  prompt: string | null;
  confidence: number | null;
  voted: boolean | null;
  evaluation_score: Record<string, number> | null;
  flags: string[] | null;
  daos: { id: string; name: string } | null;
  proposals: {
    id: string;
    proposal_id: bigint;
    title: string;
    content: string;
    status: string;
    passed: boolean | null;
    vote_start: bigint | null;
    vote_end: bigint | null;
    exec_start: bigint | null;
    exec_end: bigint | null;
  } | null;
}

/**
 * WARNING: This function still contains the N+1 query pattern.
 * It fetches votes for the current user's agents and then makes
 * separate calls to get agent, dao, and proposal details.
 * Refactor this similarly to fetchProposalVotes if used on performance-critical pages.
 *
 * Query key: ['votes']
 */
export async function fetchVotes(): Promise<Vote[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User not authenticated");

  // Fetch votes for the current user using profile_id with DAO and proposal details including timing
  const { data, error } = await supabase
    .from("votes")
    .select(
      `
      id,
      created_at,
      dao_id,
      wallet_id,
      profile_id,
      answer,
      proposal_id,
      reasoning,
      evaluation,
      tx_id,
      address,
      amount,
      prompt,
      confidence,
      voted,
      evaluation_score,
      flags,
      daos ( id, name ),
      proposals ( 
        id, 
        proposal_id,
        title,
        content,
        status,
        passed,
        vote_start,
        vote_end,
        exec_start,
        exec_end
      )
      `
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];
  console.log("Raw vote data:", data);
  console.log("First vote reasoning:", data[0]?.reasoning);
  // Transform data into the Vote interface
  const transformedVotes: Vote[] = (data as unknown as VoteWithRelations[]).map(
    (vote) => ({
      id: vote.id,
      created_at: vote.created_at,
      dao_id: vote.dao_id,
      dao_name: vote.daos?.name || "Unknown DAO",
      wallet_id: vote.wallet_id,
      profile_id: vote.profile_id,
      answer: vote.answer,
      proposal_id: vote.proposal_id,
      proposal_title: vote.proposals?.title || "Unknown Proposal",
      proposal_content: vote.proposals?.content || "",
      reasoning: vote.reasoning,
      evaluation: vote.evaluation,
      tx_id: vote.tx_id,
      address: vote.address,
      amount: vote.amount,
      prompt: vote.prompt,
      confidence: vote.confidence ?? null,
      voted: vote.voted,
      evaluation_score: vote.evaluation_score ?? null,
      flags: vote.flags ?? null,
      proposal_status: vote.proposals?.status || null,
      proposal_passed: vote.proposals?.passed ?? null,
      vote_start: vote.proposals?.vote_start || null,
      vote_end: vote.proposals?.vote_end || null,
      exec_start: vote.proposals?.exec_start || null,
      exec_end: vote.proposals?.exec_end || null,
      blockchain_proposal_id: vote.proposals?.proposal_id || null,
    })
  );

  return transformedVotes;
}

/**
 * Fetches votes for a specific proposal with enriched DAO and proposal data
 * @param proposalId - The UUID of the proposal to fetch votes for
 * @returns Promise<Vote[]> Array of votes with blockchain proposal IDs for the specified proposal
 */
export async function fetchProposalVotes(proposalId: string): Promise<Vote[]> {
  if (!proposalId) {
    console.warn("fetchProposalVotes called with null or empty proposalId.");
    return [];
  }
  const { data, error } = await supabase
    .from("votes")
    .select(
      `
      id,
      created_at,
      dao_id,
      wallet_id,
      profile_id,
      answer,
      proposal_id,
      reasoning,
      evaluation,
      tx_id,
      address,
      amount,
      prompt,
      confidence,
      voted,
      evaluation_score,
      flags,
      daos ( id, name ),
      proposals ( 
        id, 
        proposal_id,
        title,
        content,
        status,
        passed,
        vote_start,
        vote_end,
        exec_start,
        exec_end
      )
      `
    )
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `Error fetching votes with details for proposal ${proposalId}:`,
      error
    );
    throw error;
  }

  if (!data) {
    return [];
  }

  const transformedVotes: Vote[] = (data as unknown as VoteWithRelations[]).map(
    (vote) => ({
      id: vote.id,
      created_at: vote.created_at,
      dao_id: vote.dao_id,
      dao_name: vote.daos?.name || "Unknown DAO",
      wallet_id: vote.wallet_id,
      profile_id: vote.profile_id,
      answer: vote.answer,
      proposal_id: vote.proposal_id,
      proposal_title: vote.proposals?.title || "Current Proposal",
      proposal_content: vote.proposals?.content || "",
      reasoning: vote.reasoning,
      evaluation: vote.evaluation,
      tx_id: vote.tx_id,
      address: vote.address,
      amount: vote.amount,
      prompt: vote.prompt,
      confidence: vote.confidence ?? null,
      voted: vote.voted,
      evaluation_score: vote.evaluation_score ?? null,
      flags: vote.flags ?? null,
      proposal_status: vote.proposals?.status || null,
      proposal_passed: vote.proposals?.passed ?? null,
      vote_start: vote.proposals?.vote_start || null,
      vote_end: vote.proposals?.vote_end || null,
      exec_start: vote.proposals?.exec_start || null,
      exec_end: vote.proposals?.exec_end || null,
      blockchain_proposal_id: vote.proposals?.proposal_id || null,
    })
  );

  return transformedVotes;
}

/**
 * Helper function to format vote amounts (e.g., divide by decimals)
 * @param votes Number representing raw vote amount
 * @returns Formatted string representation
 */
export function formatVotes(votes: number | null | undefined): string | null {
  if (votes === null || votes === undefined) return null;
  if (isNaN(votes)) throw new Error("Invalid vote value: NaN");
  if (votes === 0) return "0";
  // Assuming 1e8 (100,000,000) is the correct decimal place adjustment
  const adjustedVotes = votes / 1e8;
  return adjustedVotes.toString(); // Or use .toLocaleString() for better formatting
}

// Determine cache URL based on environment variable
const url =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
    ? process.env.NEXT_PUBLIC_CACHE_URL_TESTNET
    : process.env.NEXT_PUBLIC_CACHE_URL;

/**
 * Fetches aggregate proposal votes (For/Against counts) from a Stacks cache/read-only endpoint.
 * This function does NOT cause the Supabase N+1 issue for agents/daos.
 *
 * Query key: ['proposalVotesCounts', contractPrincipal, proposalId]
 * @param contractPrincipal e.g., "SP123.my-contract"
 * @param proposalId The proposal index (uint)
 * @param bustCache Optionally force a cache refresh
 * @returns Promise resolving to the vote data including formatted counts
 */
export async function getProposalVotes(
  contractPrincipal: string,
  proposalId: number | string,
  bustCache = false
) {
  if (!url) {
    console.error("Cache URL environment variable is not set!");
    throw new Error("Cache URL is not configured.");
  }
  if (!contractPrincipal || typeof proposalId === "undefined") {
    console.error("getProposalVotes called with invalid parameters.");
    throw new Error("Invalid contract principal or proposal ID.");
  }

  const [contractAddress, contractName] = contractPrincipal.split(".");
  if (!contractAddress || !contractName) {
    throw new Error(`Invalid contract principal format: ${contractPrincipal}`);
  }

  const proposalIdString = proposalId.toString();

  try {
    // const apiUrl = `${url}/contract-calls/read-only/${contractAddress}/${contractName}/get-proposal`;
    const apiUrl = `https://aibtcdev-cache-preview.hosting-962.workers.dev/read-only/${contractAddress}/${contractName}/get-agent-permissions`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functionArgs: [{ type: "uint", value: proposalIdString }],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK,
        cacheControl: bustCache ? { bustCache: true, ttl: 3600 } : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch proposal votes from ${apiUrl}: ${response.status} ${errorText}`
      );
      throw new Error(`Failed to fetch proposal votes: ${errorText}`);
    }

    const responseData = await response.json();
    const voteData = responseData.data || responseData;

    let votesFor: string | null = null,
      votesAgainst: string | null = null;
    // Safely access and parse vote counts
    if (voteData && typeof voteData.votesFor === "string") {
      votesFor = voteData.votesFor.replace(/n$/, "");
    } else if (voteData && typeof voteData.votesFor === "number") {
      votesFor = voteData.votesFor.toString();
    }

    if (voteData && typeof voteData.votesAgainst === "string") {
      votesAgainst = voteData.votesAgainst.replace(/n$/, "");
    } else if (voteData && typeof voteData.votesAgainst === "number") {
      votesAgainst = voteData.votesAgainst.toString();
    }

    const votesForNum =
      votesFor !== null && !isNaN(Number(votesFor)) ? Number(votesFor) : null;
    const votesAgainstNum =
      votesAgainst !== null && !isNaN(Number(votesAgainst))
        ? Number(votesAgainst)
        : null;

    // Return a structured object
    return {
      votesFor: votesFor, // String version without 'n' or null
      votesAgainst: votesAgainst, // String version without 'n' or null
      formattedVotesFor: votesForNum !== null ? formatVotes(votesForNum) : null,
      formattedVotesAgainst:
        votesAgainstNum !== null ? formatVotes(votesAgainstNum) : null,
    };
  } catch (error) {
    console.error(
      `Error in getProposalVotes for ${contractPrincipal}, proposal ${proposalId}:`,
      error
    );
    throw error; // Re-throw for React Query
  }
}
