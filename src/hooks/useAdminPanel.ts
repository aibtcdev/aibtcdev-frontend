import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export type UserRole = "Normal" | "Admin" | "Participant" | "No Role";
export type SortOrder = "asc" | "desc" | null;

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  assigned_agent_address: string | null;
  account_index: number | null;
}

interface EditingProfile {
  [key: string]: {
    assigned_agent_address: string;
    account_index: string;
    role: UserRole;
  };
}

export function useAdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<EditingProfile>({});

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data.role === "Admin");
    } catch (error) {
      console.error("Failed to verify admin status:", error);
      setError("Failed to verify admin status");
      setIsAdmin(false);
    }
  };

  const fetchProfiles = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, assigned_agent_address, account_index");

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const typedProfiles = data as Profile[];
        const profilesWithDefaultRole = typedProfiles.map((profile) => ({
          ...profile,
          role: profile.role || "No Role",
        }));
        setProfiles(profilesWithDefaultRole);
        const initialEditingState = profilesWithDefaultRole.reduce(
          (acc, profile) => {
            acc[profile.id] = {
              assigned_agent_address: profile.assigned_agent_address || "",
              account_index: profile.account_index?.toString() || "",
              role: profile.role,
            };
            return acc;
          },
          {} as EditingProfile
        );
        setEditingProfile(initialEditingState);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userId: string): Promise<void> => {
    if (!isAdmin) {
      setError("Only admins can update profiles");
      return;
    }

    try {
      setError(null);
      const updates: Partial<Profile> = {
        assigned_agent_address:
          editingProfile[userId].assigned_agent_address || null,
        account_index:
          editingProfile[userId].account_index === ""
            ? 0
            : parseInt(editingProfile[userId].account_index, 10),
      };

      if (editingProfile[userId].role !== "No Role") {
        updates.role = editingProfile[userId].role;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;
      await fetchProfiles();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleInputChange = (
    userId: string,
    field: "assigned_agent_address" | "account_index" | "role",
    value: string
  ) => {
    setEditingProfile((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    checkAdminStatus();
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    isAdmin,
    editingProfile,
    updateProfile,
    handleInputChange,
  };
}
