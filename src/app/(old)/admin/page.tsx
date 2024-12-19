"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Loader } from "@/components/reusables/Loader";

type UserRole = "Normal" | "Admin" | "Participant" | "No Role";
type SortOrder = "asc" | "desc" | null;

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  assigned_agent_address: string | null;
  account_index: number | null;
}

interface SupabaseError {
  message: string;
}

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<{
    [key: string]: {
      assigned_agent_address: string;
      account_index: string;
      role: UserRole;
    };
  }>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchProfiles();
  }, []);

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

  const formatEmail = (email: string): string => {
    return email.split("@")[0].toUpperCase();
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
          {} as {
            [key: string]: {
              assigned_agent_address: string;
              account_index: string;
              role: UserRole;
            };
          }
        );
        setEditingProfile(initialEditingState);
      }
    } catch (error) {
      const supabaseError = error as SupabaseError;
      setError(supabaseError.message);
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

      // Update the role only if it's not "No Role"
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
      const supabaseError = error as SupabaseError;
      setError(supabaseError.message);
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

  const toggleSort = () => {
    setSortOrder((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  const sortProfiles = (profiles: Profile[]): Profile[] => {
    if (sortOrder === null) return profiles;

    return [...profiles].sort((a, b) => {
      const indexA = a.account_index ?? 0;
      const indexB = b.account_index ?? 0;

      if (sortOrder === "asc") {
        return indexA - indexB;
      } else {
        return indexB - indexA;
      }
    });
  };

  const getSortIcon = () => {
    if (sortOrder === "asc")
      return <ArrowUp className="inline-block ml-1 h-4 w-4" />;
    if (sortOrder === "desc")
      return <ArrowDown className="inline-block ml-1 h-4 w-4" />;
    return <ArrowUpDown className="inline-block ml-1 h-4 w-4" />;
  };

  const getSortText = () => {
    if (sortOrder === "asc") return "Ascending";
    if (sortOrder === "desc") return "Descending";
    return "Default";
  };

  const filteredProfiles = profiles.filter((profile) => {
    const stacksAddress = profile.email.split("@")[0].toLowerCase();
    const matchesSearch = stacksAddress.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || profile.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const sortedAndFilteredProfiles = sortProfiles(filteredProfiles);

  if (loading) {
    return <Loader />;
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-4xl mx-auto my-8">
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Access denied. Only administrators can manage profiles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto my-8">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search Stacks address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as UserRole | "All")}
          >
            <Link href="/admin/metrics">
              <Button>See metrics</Button>
            </Link>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              <SelectItem value="No Role">No Role</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Participant">Participant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchTerm || roleFilter !== "All") && (
          <div className="mt-2 text-sm text-gray-500">
            Found: {filteredProfiles.length} results
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="px-4 py-2 text-left cursor-pointer"
                  onClick={toggleSort}
                >
                  Account Index {getSortIcon()}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({getSortText()})
                  </span>
                </th>
                <th className="px-4 py-2 text-left">Stacks Addresses</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Agent Address</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredProfiles.map((profile) => (
                <tr key={profile.id} className="border-b">
                  <td className="px-4 py-2">
                    <Input
                      type="text"
                      value={editingProfile[profile.id]?.account_index || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          handleInputChange(profile.id, "account_index", value);
                        }
                      }}
                      placeholder="Enter account index"
                      className="w-full"
                    />
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {formatEmail(profile.email)}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="w-full p-2 border rounded-md"
                      value={editingProfile[profile.id]?.role || profile.role}
                      onChange={(e) =>
                        handleInputChange(
                          profile.id,
                          "role",
                          e.target.value as UserRole
                        )
                      }
                    >
                      <option value="No Role">No Role</option>
                      <option value="Normal">Normal</option>
                      <option value="Admin">Admin</option>
                      <option value="Participant">Participant</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="text"
                      value={
                        editingProfile[profile.id]?.assigned_agent_address || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          profile.id,
                          "assigned_agent_address",
                          e.target.value
                        )
                      }
                      placeholder="Enter agent address"
                      className="w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateProfile(profile.id)}
                      className="mr-2"
                    >
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange(
                          profile.id,
                          "assigned_agent_address",
                          ""
                        )
                      }
                    >
                      Clear Agent
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedAndFilteredProfiles.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No profiles found matching your search and filter criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
