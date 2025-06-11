import { useEffect, useState, useCallback } from "react";
import { useToast } from "./useToast";
import { supabase } from "@/utils/supabase/client";
import { Thread } from "@/types";

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchThreads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setThreads(data || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("threads")
        .insert([
          {
            profile_id: profileId,
            title: "New Chat",
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setThreads((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Error",
        description: "Failed to create new thread",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    threads,
    loading,
    createThread,
    refreshThreads: fetchThreads,
  };
}
