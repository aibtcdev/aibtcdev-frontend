import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseSmartCacheBustingProps {
  proposalId: string | number;
  contractPrincipal: string;
  proposalStatus: string;
  isActive: boolean;
}

/**
 * Smart cache busting hook that:
 * 1. Busts cache once when transitioning to veto/execution periods
 * 2. Only polls during active voting
 * 3. Tracks status transitions to avoid redundant cache busting
 */
export function useSmartCacheBusting({
  proposalId,
  contractPrincipal,
  proposalStatus,
  isActive,
}: UseSmartCacheBustingProps) {
  const queryClient = useQueryClient();
  const [shouldBustCache, setShouldBustCache] = useState(false);
  const previousStatusRef = useRef<string | null>(null);
  const hasBustedForStatusRef = useRef<Set<string>>(new Set());

  // Track status transitions and determine when to bust cache
  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const currentStatus = proposalStatus;

    // Skip if this is the first render
    if (previousStatus === null) {
      previousStatusRef.current = currentStatus;
      return;
    }

    // Skip if status hasn't changed
    if (previousStatus === currentStatus) {
      return;
    }

    // Determine if we need to bust cache for this status transition
    const shouldBustForTransition =
      // Transitioning from ACTIVE to VETO_PERIOD (voting just ended)
      (previousStatus === "ACTIVE" && currentStatus === "VETO_PERIOD") ||
      // Transitioning from VETO_PERIOD to EXECUTION_WINDOW
      (previousStatus === "VETO_PERIOD" &&
        currentStatus === "EXECUTION_WINDOW") ||
      // Transitioning to any final state (PASSED/FAILED)
      currentStatus === "PASSED" ||
      currentStatus === "FAILED";

    if (
      shouldBustForTransition &&
      !hasBustedForStatusRef.current.has(currentStatus)
    ) {
      console.log(
        `Smart cache bust triggered: ${previousStatus} → ${currentStatus}`
      );
      setShouldBustCache(true);
      hasBustedForStatusRef.current.add(currentStatus);
    }

    previousStatusRef.current = currentStatus;
  }, [proposalStatus]);

  // Reset cache bust flag after it's been used
  const resetCacheBust = () => {
    setShouldBustCache(false);
  };

  // Invalidate queries when cache bust is needed
  useEffect(() => {
    if (shouldBustCache && proposalId && contractPrincipal) {
      const invalidateQueries = async () => {
        try {
          await queryClient.invalidateQueries({
            queryKey: ["proposalVotes", contractPrincipal, proposalId],
            refetchType: "all",
          });

          // Also invalidate the general proposals query to update proposal data
          await queryClient.invalidateQueries({
            queryKey: ["proposals"],
          });

          console.log(
            `Cache invalidated for proposal ${proposalId} due to status transition`
          );
        } catch (error) {
          console.error("Failed to invalidate queries:", error);
        }
      };

      invalidateQueries();
    }
  }, [shouldBustCache, proposalId, contractPrincipal, queryClient]);

  return {
    shouldBustCache,
    resetCacheBust,
    // Disable polling - only use cache busting
    shouldPoll: false, // No polling, cache busting only
    pollInterval: undefined, // No polling intervals
    staleTime: isActive ? 60000 : 300000, // 1 minute for active, 5 minutes for others
  };
}
