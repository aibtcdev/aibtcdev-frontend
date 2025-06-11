import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Agent } from "@/types";
import { useToast } from "@/hooks/useToast";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .order("is_archived", { ascending: true })
          .order("name", { ascending: true })
          .eq("name", "DAO Manager");
        // .single()

        if (error) {
          throw error;
        }

        setAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
        toast({
          title: "Error",
          description: "Failed to fetch available agents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  return { agents, loading };
}
