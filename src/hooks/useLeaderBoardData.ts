import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

async function fetchLeaderboardData() {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, assigned_agent_address")
    .eq("role", "Participant");

  if (error) throw error;

  const profilesWithBalance = await Promise.all(
    data.map(async (profile) => {
      const stacksAddress = profile.assigned_agent_address
        ? profile.assigned_agent_address.toUpperCase()
        : null;

      let agentBalance = undefined;
      if (stacksAddress) {
        const agentResponse = await fetch(
          `/fetch?address=${stacksAddress}`
        );

        if (agentResponse.ok) {
          const agentBalanceData = await agentResponse.json();
          agentBalance = agentBalanceData.stx?.balance
            ? parseInt(agentBalanceData.stx.balance) / 1000000
            : 0;
        }
      }

      return {
        email: profile.email,
        assigned_agent_address: stacksAddress,
        agentBalance,
      };
    })
  );

  return profilesWithBalance.sort((a, b) => (b.agentBalance || 0) - (a.agentBalance || 0));
}

export function useLeaderboardData() {
  return useQuery({
    queryKey: ["leaderboardData"],
    queryFn: fetchLeaderboardData,
    staleTime:30000, //5 minutes
    refetchOnWindowFocus:false
  });
}