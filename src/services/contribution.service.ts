import { ContributionHistory } from "../types/contribution";
import { supabase } from "./supabase";

type SupabaseProposalResponse = {
  id: string;
  proposal_id: bigint;
  title: string;
  created_at: string;
  concluded_by: string | null;
  executed: boolean | null;
  met_quorum: boolean | null;
  met_threshold: boolean | null;
  passed: boolean | null;
  contract_caller: string;
  daos: {
    name: string;
  } | null;
};

export async function fetchAgentContributionHistory(
  agentAddress: string
): Promise<ContributionHistory[]> {
  if (!agentAddress) {
    console.log(
      "❌ No agent address provided to fetchAgentContributionHistory"
    );
    return [];
  }

  console.log("🔍 Fetching proposals created by agent:", agentAddress);

  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      id,
      proposal_id,
      title,
      created_at,
      concluded_by,
      executed,
      met_quorum,
      met_threshold,
      passed,
      contract_caller,
      daos (
        name
      )
    `
    )
    .eq("contract_caller", agentAddress)
    .order("created_at", { ascending: false })
    .returns<SupabaseProposalResponse[]>();

  console.log("📊 Query result:", {
    data,
    error,
    agentAddress,
    count: data?.length,
  });

  if (error) {
    console.error("❌ Error fetching agent proposals:", error);
    throw error;
  }

  if (!data) {
    console.log("⚠️ No proposals found for agent");
    return [];
  }

  console.log(
    `✅ Found ${data.length} proposals created by agent ${agentAddress}`
  );

  const contributions: ContributionHistory[] = data.map((proposal) => {
    const dao = proposal.daos;

    // Check if proposal is still pending (concluded_by is null)
    const isPending = proposal.concluded_by === null;

    let rewardAmount = 0;
    let rewardType: "gain" | "loss" | "pending" = "pending";

    if (isPending) {
      // Pending proposals have no reward yet
      rewardAmount = 0;
      rewardType = "pending";
    } else {
      // Concluded proposals - check if successful
      const isSuccessfulContribution =
        proposal.executed &&
        proposal.met_quorum &&
        proposal.met_threshold &&
        proposal.passed;

      if (isSuccessfulContribution) {
        rewardAmount = 1000;
        rewardType = "gain";
      } else {
        rewardAmount = 250;
        rewardType = "loss";
      }
    }

    return {
      id: proposal.id,
      dao_name: dao?.name ?? "Unknown DAO",
      proposal_title: proposal.title || "Unknown Proposal",
      proposal_id: proposal.proposal_id,
      created_at: proposal.created_at,
      concluded_by: proposal.concluded_by,
      executed: proposal.executed,
      met_quorum: proposal.met_quorum,
      met_threshold: proposal.met_threshold,
      passed: proposal.passed,
      // agent_vote: not needed for contribution history
      reward_amount: rewardAmount,
      reward_type: rewardType,
    };
  });

  return contributions;
}

/**
 * Check if any proposals exist in the specified Bitcoin block height for a specific DAO
 * @param bitcoinBlockHeight - The Bitcoin block height to check
 * @param daoId - The DAO ID to check proposals for
 * @returns Promise resolving to true if proposals exist in that block for the DAO, false otherwise
 */
export async function checkProposalsInBitcoinBlock(
  bitcoinBlockHeight: number,
  daoId: string
): Promise<boolean> {
  if (!bitcoinBlockHeight || bitcoinBlockHeight <= 0) {
    console.log("❌ Invalid Bitcoin block height provided");
    return false;
  }

  if (!daoId) {
    console.log("❌ Invalid DAO ID provided");
    return false;
  }

  console.log(
    `🔍 Checking for proposals in Bitcoin block ${bitcoinBlockHeight} for DAO:`,
    daoId
  );

  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("id, created_btc, dao_id")
      .eq("created_btc", bitcoinBlockHeight.toString())
      .eq("dao_id", daoId)
      .limit(1);

    if (error) {
      console.error("❌ Error checking proposals in Bitcoin block:", error);
      throw error;
    }

    const hasProposals = data && data.length > 0;
    console.log(
      `📊 Bitcoin block ${bitcoinBlockHeight} for DAO ${daoId} has proposals:`,
      hasProposals
    );

    return hasProposals;
  } catch (error) {
    console.error("❌ Error in checkProposalsInBitcoinBlock:", error);
    return false;
  }
}
