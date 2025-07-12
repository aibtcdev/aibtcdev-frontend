import { useState, useMemo, useCallback } from "react";
import { Profile, UserRole, SortOrder } from "./useAdminPanel";

export function useAdminFilters(profiles: Profile[]) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const toggleSort = () => {
    setSortOrder((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  const sortProfiles = useCallback(
    (profiles: Profile[]): Profile[] => {
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
    },
    [sortOrder]
  );

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const stacksAddress = profile.email.split("@")[0].toLowerCase();
      const matchesSearch = stacksAddress.includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || profile.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, roleFilter]);

  const sortedAndFilteredProfiles = useMemo(() => {
    return sortProfiles(filteredProfiles);
  }, [filteredProfiles, sortProfiles]);

  return {
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    sortOrder,
    toggleSort,
    filteredProfiles,
    sortedAndFilteredProfiles,
  };
}
