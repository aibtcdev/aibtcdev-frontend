import { supabase } from "./supabase";
import { singleDaoName } from "@/config/features";

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

  // Fetch all DEPLOYED proposals for the specific DAO
  const { data: proposals, error } = await supabase
    .from("proposals")
    .select(
      "id, contract_caller, concluded_by, executed, met_quorum, met_threshold, passed, status, dao_id"
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

  proposals.forEach((proposal) => {
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

      // Pending proposals (not concluded yet)
      const pendingProposals = userProposals.filter(
        (p) => p.concluded_by === null
      ).length;

      // Passed proposals (successful contributions)
      const passedProposals = userProposals.filter(
        (p) =>
          p.concluded_by !== null &&
          p.executed === true &&
          p.met_quorum === true &&
          p.met_threshold === true &&
          p.passed === true
      ).length;

      // Failed proposals (concluded but not successful)
      const failedProposals = userProposals.filter(
        (p) =>
          p.concluded_by !== null &&
          !(
            p.executed === true &&
            p.met_quorum === true &&
            p.met_threshold === true &&
            p.passed === true
          )
      ).length;

      // Calculate success rate (excluding pending)
      const concludedProposals = totalProposals - pendingProposals;
      const successRate =
        concludedProposals > 0
          ? Math.round((passedProposals / concludedProposals) * 100)
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
        btcEarned: passedProposals * 50,
      });
    }
  );

  // Sort by total proposals descending
  metricsArray.sort((a, b) => b.totalProposals - a.totalProposals);

  return metricsArray;
}
