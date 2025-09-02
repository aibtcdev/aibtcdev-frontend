import { supabase } from "./supabase";

export interface ContributionHistory {
  id: string;
  dao_name: string;
  proposal_title: string;
  proposal_id: bigint;
  created_at: string;
  executed: boolean;
  met_quorum: boolean;
  met_threshold: boolean;
  passed: boolean;
  agent_vote: boolean;
  reward_amount: number;
  reward_type: "gain" | "loss";
}

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
    .order("created_at", { ascending: false });

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

  const contributions: ContributionHistory[] = data.map((proposal: any) => {
    const dao = proposal.daos;

    const isSuccessfulContribution =
      proposal.executed &&
      proposal.met_quorum &&
      proposal.met_threshold &&
      proposal.passed;

    const isFailedContribution = !isSuccessfulContribution;

    let rewardAmount = 0;
    let rewardType: "gain" | "loss" = "gain";

    if (isSuccessfulContribution) {
      rewardAmount = 1000;
      rewardType = "gain";
    } else if (isFailedContribution) {
      rewardAmount = 250;
      rewardType = "loss";
    }

    return {
      id: proposal.id,
      dao_name: dao?.name || "Unknown DAO",
      proposal_title: proposal.title || "Unknown Proposal",
      proposal_id: proposal.proposal_id,
      created_at: proposal.created_at,
      executed: proposal.executed || false,
      met_quorum: proposal.met_quorum || false,
      met_threshold: proposal.met_threshold || false,
      passed: proposal.passed || false,
      agent_vote: true, // Agent created the proposal, so it's always "for"
      reward_amount: rewardAmount,
      reward_type: rewardType,
    };
  });

  return contributions;
}
