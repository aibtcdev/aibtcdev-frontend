import { supabase } from "./supabase";
import { singleDaoName, rewardPerPassedProposal } from "@/config/features";
import { fetchProposalVotes } from "./vote.service";
import { fetchLatestChainState } from "./chain-state.service";
import { getProposalStatus } from "@/utils/proposal";

type ProposalRecord = {
  id: string;
  contract_caller: string | null;
  concluded_by: string | null;
  executed: boolean | null;
  dao_id: string;
  status: string | null;
  liquid_tokens: string | number | null;
  voting_quorum: string | number | null;
  voting_threshold: string | number | null;
  votes_for: string | number | null;
  votes_against: string | number | null;
  met_quorum: boolean | null;
  met_threshold: boolean | null;
  passed: boolean | null;
  vote_start: string | number | bigint | null;
  vote_end: string | number | bigint | null;
  exec_start: string | number | bigint | null;
  exec_end: string | number | bigint | null;
};

const parseNumericValue = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export interface UserMetrics {
  username: string;
  address: string;
  totalProposals: number;
  passedProposals: number;
  failedProposals: number;
  pendingProposals: number;
  successRate: number;
  btcEarned: number;
}

export async function fetchAllUserMetrics(): Promise<UserMetrics[]> {
  // First fetch the DAO ID for singleDaoName
  const { data: dao, error: daoError } = await supabase
    .from("daos")
    .select("id")
    .eq("name", singleDaoName)
    .eq("is_broadcasted", true)
    .single();

  if (daoError) {
    console.error("Error fetching DAO:", daoError);
    throw daoError;
  }

  if (!dao) {
    console.error(`DAO not found: ${singleDaoName}`);
    return [];
  }

  // Fetch current block height
  const latestChainState = await fetchLatestChainState();
  const currentBlockHeight = latestChainState?.bitcoin_block_height
    ? Number(latestChainState.bitcoin_block_height)
    : null;

  // Fetch all DEPLOYED proposals for the specific DAO
  const { data: proposals, error } = await supabase
    .from("proposals")
    .select(
      `id,
      contract_caller,
      concluded_by,
      executed,
      status,
      dao_id,
      liquid_tokens,
      voting_quorum,
      voting_threshold,
      votes_for,
      votes_against,
      met_quorum,
      met_threshold,
      passed,
      vote_start,
      vote_end,
      exec_start,
      exec_end`
    )
    .eq("status", "DEPLOYED")
    .eq("dao_id", dao.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching proposals:", error);
    throw error;
  }

  if (!proposals || proposals.length === 0) {
    return [];
  }

  const typedProposals = proposals as ProposalRecord[];

  // Fetch individual votes for all proposals to calculate accurate quorum/threshold
  const proposalOutcomeMap = new Map<
    string,
    { metQuorum: boolean; metThreshold: boolean }
  >();

  await Promise.all(
    typedProposals.map(async (proposal) => {
      try {
        const votes = await fetchProposalVotes(proposal.id);

        const { totalFor, totalAgainst } = votes.reduce(
          (acc, vote) => {
            const amount = vote.amount ? parseFloat(vote.amount) : 1;
            if (vote.answer === true) {
              acc.totalFor += amount;
            } else {
              acc.totalAgainst += amount;
            }
            return acc;
          },
          { totalFor: 0, totalAgainst: 0 }
        );

        const liquidTokens = parseNumericValue(proposal.liquid_tokens);
        const quorumRequired = parseNumericValue(proposal.voting_quorum);
        const thresholdRequired = parseNumericValue(proposal.voting_threshold);
        const totalVotes = totalFor + totalAgainst;

        const participationRate =
          liquidTokens > 0 ? (totalVotes / liquidTokens) * 100 : 0;
        const approvalRate = totalVotes > 0 ? (totalFor / totalVotes) * 100 : 0;

        proposalOutcomeMap.set(proposal.id, {
          metQuorum: participationRate >= quorumRequired,
          metThreshold: approvalRate >= thresholdRequired,
        });
      } catch (error) {
        console.error(
          `Error fetching votes for proposal ${proposal.id}:`,
          error
        );
        // Default to false if we can't fetch votes
        proposalOutcomeMap.set(proposal.id, {
          metQuorum: false,
          metThreshold: false,
        });
      }
    })
  );

  // Fetch agents with their profiles
  const { data: agentsWithProfiles, error: agentsError } = await supabase.from(
    "agents"
  ).select(`
      id,
      account_contract,
      profile_id,
      profiles (
        id,
        username
      )
    `);

  if (agentsError) {
    console.error("Error fetching agents:", agentsError);
  }

  // Create mapping from account_contract to username
  const accountToUsernameMap = new Map<string, string>();
  const accountToAddressMap = new Map<string, string>();

  if (agentsWithProfiles) {
    agentsWithProfiles.forEach((agent) => {
      if (agent.account_contract) {
        const profile = Array.isArray(agent.profiles)
          ? agent.profiles[0]
          : agent.profiles;
        const username = profile?.username;
        const accountContract = agent.account_contract;

        if (username) {
          // Store full account_contract as key
          accountToUsernameMap.set(accountContract, username);
          accountToAddressMap.set(accountContract, accountContract);

          // Also store just the contract name part if it contains a dot
          if (accountContract.includes(".")) {
            const contractName = accountContract.split(".")[1];
            if (contractName && !accountToUsernameMap.has(contractName)) {
              accountToUsernameMap.set(contractName, username);
              accountToAddressMap.set(contractName, accountContract);
            }
          }
        }
      }
    });
    console.log(`👤 Mapped ${accountToUsernameMap.size} accounts to usernames`);
  }

  // Group proposals by contract_caller (account_contract)
  const accountProposalsMap = new Map<string, typeof proposals>();

  typedProposals.forEach((proposal) => {
    const contractCaller = proposal.contract_caller;
    if (!contractCaller) return;

    if (!accountProposalsMap.has(contractCaller)) {
      accountProposalsMap.set(contractCaller, []);
    }
    accountProposalsMap.get(contractCaller)!.push(proposal);
  });

  console.log(
    `📊 Grouped proposals from ${accountProposalsMap.size} unique accounts`
  );

  // Calculate metrics for each user
  const metricsArray: UserMetrics[] = [];

  Array.from(accountProposalsMap.entries()).forEach(
    ([accountContract, userProposals]) => {
      const totalProposals = userProposals.length;

      const pendingProposals = userProposals.filter(
        (proposal) => !proposal.concluded_by
      ).length;

      const concludedProposalsCount = totalProposals - pendingProposals;

      const passedProposals = userProposals.filter((proposal) => {
        // Get proposal status to check if it meets quorum and threshold
        const status = getProposalStatus(proposal as any, currentBlockHeight);

        // Count as passed if: ACTIVE and met requirements, or in any ended state and met requirements
        const isActiveOrEnded = [
          "ACTIVE",
          "PASSED",
          "FAILED",
          "VETO_PERIOD",
          "EXECUTION_WINDOW",
        ].includes(status);

        if (!isActiveOrEnded) return false;

        const outcome = proposalOutcomeMap.get(proposal.id);
        return outcome?.metQuorum && outcome?.metThreshold;
      }).length;

      const failedProposals = Math.max(
        concludedProposalsCount - passedProposals,
        0
      );

      const successRate =
        concludedProposalsCount > 0
          ? Math.round((passedProposals / concludedProposalsCount) * 100)
          : 0;

      // Try to get username - first try full match, then contract name only
      let username = accountToUsernameMap.get(accountContract);
      if (!username && accountContract.includes(".")) {
        const contractName = accountContract.split(".")[1];
        username = accountToUsernameMap.get(contractName);
      }

      // if (username) {
      //   matchedUsers++;
      // } else {
      //   unmatchedUsers++;
      // }

      metricsArray.push({
        username: username || "",
        address: accountContract,
        totalProposals,
        passedProposals,
        failedProposals,
        pendingProposals,
        successRate,
        btcEarned: passedProposals * rewardPerPassedProposal,
      });
    }
  );

  // Sort by total proposals descending
  metricsArray.sort((a, b) => b.totalProposals - a.totalProposals);

  return metricsArray;
}
