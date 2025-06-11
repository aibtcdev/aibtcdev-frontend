import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export function useThread(threadId: string) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("threads")
          .select("*")
          .eq("id", threadId)
          .single();

        if (error) {
          throw error;
        }

        setThread(data);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching thread:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (threadId) {
      fetchThread();
    }
  }, [threadId]);

  const clearThread = async () => {
    try {
      await supabase.from("threads").delete().eq("id", threadId);
      setThread(null);
    } catch (err) {
      console.error("Error clearing thread:", err);
      throw err;
    }
  };

  const updateThread = async (updates: Partial<Thread>) => {
    try {
      const { data, error } = await supabase
        .from("threads")
        .update(updates)
        .eq("id", threadId)
        .select()
        .single();

      if (error) throw error;
      if (data) setThread(data);

      return data;
    } catch (err) {
      console.error("Error updating thread:", err);
      throw err;
    }
  };

  return {
    thread,
    isLoading,
    error,
    clearThread,
    updateThread,
  };
}
