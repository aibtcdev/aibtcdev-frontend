import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export function useAgentName(agentId: string | undefined) {
  const [agentName, setAgentName] = useState<string | null>(null);

  useEffect(() => {
    // console.log("useAgentName hook called with agentId:", agentId);

    const fetchAgentName = async () => {
      if (!agentId) {
        // console.log("No agentId provided, skipping fetch");
        return;
      }

      try {
        // console.log("Fetching agent name for id:", agentId);
        const { data, error } = await supabase
          .from("agents")
          .select("name")
          .eq("id", agentId)
          .single();

        if (error) {
          console.error("Error fetching agent name:", error);
          return;
        }

        // console.log("Fetched agent name:", data.name);
        setAgentName(data.name);
      } catch (error) {
        console.error("Error fetching agent name:", error);
      }
    };

    fetchAgentName();
  }, [agentId]);

  return agentName;
}
