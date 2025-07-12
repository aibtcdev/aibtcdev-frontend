import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface Profile {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        // console.log(user)
        setProfile({
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        setProfile({
          user: null,
          loading: false,
          error: error as Error,
        });
      }
    }

    loadProfile();
  }, []);

  return profile;
}
