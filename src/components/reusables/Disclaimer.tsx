import * as React from "react";
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  className?: string;
}

export function Disclaimer({ className }: DisclaimerProps) {
  return (
    <div className={cn("text-center space-y-3", className)}>
      <p className="text-xs leading-relaxed text-muted-foreground/80 max-w-3xl mx-auto">
        aibtc.dev is not liable for any lost, locked, or mistakenly sent funds.
        This is alpha software—use at your own risk.
      </p>
    </div>
  );
}
