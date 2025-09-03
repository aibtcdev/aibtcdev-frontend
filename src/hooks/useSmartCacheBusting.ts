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
 * 1. Busts cache for active proposals (forces fresh data)
 * 2. Busts cache once when transitioning between statuses
 * 3. Uses normal caching otherwise
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

    // Cache bust for specific status transitions (if not already busted)
    if (!hasBustedForStatusRef.current.has(currentStatus)) {
      const criticalTransitions = [
        // Transitioning from ACTIVE to VETO_PERIOD (voting just ended)
        previousStatus === "ACTIVE" && currentStatus === "VETO_PERIOD",
        // Transitioning from VETO_PERIOD to EXECUTION_WINDOW
        previousStatus === "VETO_PERIOD" &&
          currentStatus === "EXECUTION_WINDOW",
        // Transitioning to any final state
        currentStatus === "PASSED",
        currentStatus === "FAILED",
      ];

      if (criticalTransitions.some(Boolean)) {
        console.log(
          `🔄 Cache bust triggered: ${previousStatus} → ${currentStatus}`
        );
        setShouldBustCache(true);
        hasBustedForStatusRef.current.add(currentStatus);
      }
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

          console.log(`✅ Cache invalidated for proposal ${proposalId}`);
        } catch (error) {
          console.error("❌ Failed to invalidate queries:", error);
        }
      };

      invalidateQueries();
    }
  }, [shouldBustCache, proposalId, contractPrincipal, queryClient]);

  return {
    shouldBustCache,
    resetCacheBust,
    // For active proposals, always bust cache (force fresh data)
    // For others, use normal caching
    shouldAlwaysBustCache: isActive,
    staleTime: 300000, // 5 minutes default stale time
  };
}
