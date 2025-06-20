import type { Proposal } from "@/types";

/**
 * Safely converts a bigint or null value to a number, returning 0 if null
 * @param value - The bigint value to convert, can be null
 * @returns The converted number or 0 if input is null
 */
export const safeNumberFromBigInt = (value: bigint | null): number => {
  return value ? Number(value) : 0;
};

/**
 * Safely converts a string or null value to a string, returning empty string if null
 * @param value - The string value to convert, can be null
 * @returns The original string or empty string if input is null
 */
export const safeString = (value: string | null): string => {
  return value || "";
};

/**
 * Safely converts a bigint or null value to a string, returning empty string if null
 * @param value - The bigint value to convert, can be null
 * @returns The converted string or empty string if input is null
 */
export const safeStringFromBigInt = (value: bigint | null): string => {
  return value ? String(value) : "";
};

/**
 * Helper to get safe values for VoteProgress component
 * @param proposal - The proposal object with potentially null values
 * @returns Object with safe string values for the VoteProgress component
 */
export const getVoteProgressProps = (proposal: Proposal) => {
  return {
    contractAddress: safeString(proposal.contract_principal),
    proposalId: safeStringFromBigInt(proposal.proposal_id),
    votesFor: safeString(proposal.votes_for),
    votesAgainst: safeString(proposal.votes_against),
    liquidTokens: safeString(proposal.liquid_tokens),
  };
};

/**
 * Helper to get safe values for TimeStatus component
 * @param proposal - The proposal object with potentially null values
 * @returns Object with safe values for the TimeStatus component
 */
export const getTimeStatusProps = (proposal: Proposal) => {
  return {
    createdAt: proposal.created_at,
    status: proposal.status,
    concludedBy: proposal.concluded_by || undefined,
    vote_start: safeNumberFromBigInt(proposal.vote_start),
    vote_end: safeNumberFromBigInt(proposal.vote_end),
  };
};

/**
 * Helper to get safe values for BlockVisual component
 * @param value - The bigint value to convert, can be null
 * @returns Safe number value for the BlockVisual component
 */
export const getBlockVisualProps = (value: bigint | null): number => {
  return safeNumberFromBigInt(value);
};

/**
 * Determine the current status of a proposal based on timing windows
 * This matches the logic used in ProposalCard component
 * @param proposal - The proposal object
 * @returns Status label that matches ProposalCard display
 */
export const getProposalStatus = (
  proposal: Proposal,
  currentBlockHeight?: number | null
): string => {
  // Check if proposal is in draft status first
  if (proposal.status === "DRAFT") {
    return "DRAFT";
  }

  // If we don't have block height, we can't determine the status accurately
  if (!currentBlockHeight) {
    // We can either return a default "loading" state or try a fallback
    // For now, let's reflect that the status is being determined
    return "PENDING";
  }

  // For deployed proposals, determine status based on timing windows
  const voteStart = safeNumberFromBigInt(proposal.vote_start);
  const voteEnd = safeNumberFromBigInt(proposal.vote_end);
  const execStart = safeNumberFromBigInt(proposal.exec_start || null);
  const execEnd = safeNumberFromBigInt(proposal.exec_end || null);

  // If vote_start is 0, it indicates that the proposal is not yet finalized
  if (voteStart === 0) {
    return "PENDING";
  }

  // Initial delay before voting window
  if (currentBlockHeight < voteStart) {
    return "PENDING";
  }

  // Inside voting window
  if (currentBlockHeight >= voteStart && currentBlockHeight < voteEnd) {
    return "ACTIVE";
  }

  // Veto window (between vote_end and exec_start)
  if (
    execStart > 0 &&
    currentBlockHeight >= voteEnd &&
    currentBlockHeight < execStart
  ) {
    return "VETO_PERIOD";
  }

  // Execution window (between exec_start and exec_end)
  if (
    execStart > 0 &&
    execEnd > 0 &&
    currentBlockHeight >= execStart &&
    currentBlockHeight < execEnd
  ) {
    return "EXECUTION_WINDOW";
  }

  // Completed (after exec_end or vote_end if no execution window)
  if (currentBlockHeight >= execEnd) {
    if (proposal.passed) {
      return "PASSED";
    } else {
      return "FAILED";
    }
  }

  // Fallback
  return "UNKNOWN";
};

/**
 * Get user-friendly status label for display
 * @param status - The status returned by getProposalStatus
 * @returns Display label
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING":
      return "Pending";
    case "ACTIVE":
      return "Active";
    case "VETO_PERIOD":
      return "Veto Period";
    case "EXECUTION_WINDOW":
      return "Execution Window";
    case "PASSED":
      return "Passed";
    case "FAILED":
      return "Failed";
    default:
      return "Unknown";
  }
};
