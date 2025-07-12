import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export function useGuide() {
  const [hasCompletedGuide, setHasCompletedGuide] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGuideCompletion();
  }, []);

  async function checkGuideCompletion() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("has_completed_guide")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching guide completion status:", error);
          return;
        }

        setHasCompletedGuide(data?.has_completed_guide || false);
      }
    } catch (error) {
      console.error("Error in checkGuideCompletion:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateGuideCompletion() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found during update");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ has_completed_guide: true })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Error updating guide completion:", error);
        throw error;
      }

      setHasCompletedGuide(true);
    } catch (error) {
      console.error("Error in updateGuideCompletion:", error);
    }
  }

  return { hasCompletedGuide, loading, updateGuideCompletion };
}
