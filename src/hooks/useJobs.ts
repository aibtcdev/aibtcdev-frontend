import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

export interface Job {
  id: string;
  created_at: string;
  task_id: string;
  agent_id: string;
  profile_id: string;
  status: string;
  result?: string;
  error?: string;
  task_name?: string;
}

export function useJobs(agentId: string, profileId: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: jobsError } = await supabase
          .from("jobs")
          .select(
            `
                        *,
                        tasks (
                            name
                        )
                    `
          )
          .eq("agent_id", agentId)
          .eq("profile_id", profileId)
          .not("task_id", "is", null)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        setJobs(
          data.map((job) => ({
            ...job,
            task_name: job.tasks?.name,
          }))
        );
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch jobs")
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId && profileId) {
      fetchJobs();
    }
  }, [agentId, profileId]);

  return { jobs, isLoading, error };
}
