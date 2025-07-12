import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Agent } from "@/types";
interface Wallet {
  mainnet_address: string;
  testnet_address: string;
}

interface AgentWithWallet extends Agent {
  wallet?: Wallet;
}

export function useAgentDetails() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<AgentWithWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async (id: string) => {
      setLoading(true);
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single();

      if (agentError) {
        toast({
          title: "Error",
          description: "Failed to fetch agent details",
          variant: "destructive",
        });
        router.push("/agents");
        return;
      }

      // Fetch wallet information
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("mainnet_address, testnet_address")
        .eq("agent_id", id)
        .single();

      if (walletError && walletError.code !== "PGRST116") {
        // Ignore not found error
        toast({
          title: "Warning",
          description: "Failed to fetch wallet details",
          variant: "destructive",
        });
      }

      setAgent({ ...agentData, wallet: walletData || undefined });
      setLoading(false);
    };

    if (params.id) {
      fetchAgent(params.id as string);
    }
  }, [params.id, router, toast]);

  return {
    agent,
    loading,
  };
}
