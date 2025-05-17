"use client";

import { ExternalLink, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface BlockVisualProps {
  value: number;
  type: "bitcoin" | "stacks";
}

const BlockVisual = ({ value, type }: BlockVisualProps) => {
  const getExplorerUrl = () => {
    return type === "bitcoin"
      ? `https://mempool.space/block/${value}`
      : `https://explorer.stacks.co/block/${value}`;
  };

  const getTypeColor = () => {
    return type === "bitcoin"
      ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
      : "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge
          variant="outline"
          className={`${getTypeColor()} font-medium text-xs h-5`}
        >
          {type === "bitcoin" ? "BTC" : "STX"}
        </Badge>
        <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
          {value}
        </code>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-pointer">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">Block explanation</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>
              {type === "bitcoin"
                ? "BTC block marks the start and end of a voting period."
                : "Stacks block records the snapshot for governance."}
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">View on explorer</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>View on {type === "bitcoin" ? "Bitcoin" : "Stacks"} explorer</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default BlockVisual;
