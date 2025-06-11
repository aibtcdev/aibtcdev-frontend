import { supabase } from "./supabase";
import type { Job } from "@/types";

/**
 * Fetches jobs for a specific agent and profile
 *
 * Query key: ['jobs', agentId, profileId]
 * Used in: src/components/tasks/jobs-table.tsx
 */
export async function fetchJobs(
  agentId: string,
  profileId: string
): Promise<Job[]> {
  try {
    if (!agentId || !profileId) {
      return [];
    }

    const { data, error } = await supabase
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

    if (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }

    return data.map((job) => ({
      ...job,
      task_name: job.tasks?.name,
    }));
  } catch (err) {
    console.error("Error in fetchJobs:", err);
    return [];
  }
}
