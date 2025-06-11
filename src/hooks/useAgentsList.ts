import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Agent } from "@/types";

export function useAgentsList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const { toast } = useToast();

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("is_archived", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
      return;
    }

    const agents = data as Agent[];
    setAgents(agents || []);
  }, [toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    fetchAgents,
  };
}
