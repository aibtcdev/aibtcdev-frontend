import { Badge } from "@/components/ui/badge";

interface ProposalStatusBadgeProps {
  isActive: boolean;
  isEnded: boolean;
  passed: boolean;
  className?: string;
}

export function ProposalStatusBadge({
  isActive,
  isEnded,
  passed,
  className = "",
}: ProposalStatusBadgeProps) {
  if (isActive) {
    return (
      <Badge
        className={`bg-primary/20 text-primary hover:bg-primary/30 border-primary/50 transition-colors duration-150 ${className}`}
      >
        Active
      </Badge>
    );
  }

  if (isEnded && passed) {
    return (
      <Badge
        className={`bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50 transition-colors duration-150 ${className}`}
      >
        Passed
      </Badge>
    );
  }

  if (isEnded && !passed) {
    return (
      <Badge
        className={`bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/50 transition-colors duration-150 ${className}`}
      >
        Failed
      </Badge>
    );
  }

  return (
    <Badge
      className={`bg-muted/50 text-muted-foreground hover:bg-muted/70 border-muted transition-colors duration-150 ${className}`}
    >
      Pending
    </Badge>
  );
}
