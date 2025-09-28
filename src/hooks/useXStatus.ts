import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { hasLinkedXAccount } from "@/services/x-auth.service";

export function useXStatus() {
  const { userId, isAuthenticated } = useAuth();

  const {
    data: hasX = false,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["x-status", userId],
    queryFn: hasLinkedXAccount,
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasUsername: hasX,
    needsXLink: !hasX,
    isLoading,
    refreshStatus: refetch,
  };
}

// Keep the old hook name for backward compatibility during transition
export const useTwitterStatus = useXStatus;
