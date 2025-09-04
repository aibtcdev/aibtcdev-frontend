/**
 * Truncate address for mobile display
 * Shows first 5 and last 5 characters with ellipsis in between
 */
export function truncateAddress(
  address: string,
  isMobile: boolean = false
): string {
  if (!isMobile || address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

/**
 * Hook to detect mobile screen size
 */
export function useIsMobile(): boolean {
  if (typeof window === "undefined") return false;

  return window.innerWidth < 768; // Tailwind md breakpoint
}
