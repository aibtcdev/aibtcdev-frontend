// utils/hooks/useUserData.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

async function fetchUserData() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;

  if (!user?.email) throw new Error("User or email not found");

  const address = user.email.split("@")[0];
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, assigned_agent_address")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;

  let agentBalance = null;
  if (profileData.assigned_agent_address) {
    const agentResponse = await fetch(
      `/fetch?address=${profileData.assigned_agent_address.toUpperCase()}`
    );

    if (agentResponse.ok) {
      const balanceData = await agentResponse.json();
      agentBalance = balanceData.stx?.balance
        ? parseInt(balanceData.stx.balance) / 1000000
        : 0;
    }
  }

  return {
    stxAddress: address.toUpperCase(),
    role: profileData.role,
    agentAddress: profileData.assigned_agent_address?.toUpperCase() || null,
    agentBalance,
  };
}

export function useUserData() {
  return useQuery({
    queryKey: ["userData"],
    queryFn: fetchUserData,
    staleTime: 30000, //5 minutes
    refetchOnWindowFocus: false,
  });
}
