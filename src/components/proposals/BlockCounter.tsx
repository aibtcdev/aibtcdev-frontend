import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Timer } from "lucide-react";

interface BlockCounterProps {
  currentBlock: number;
  targetBlock: number;
  blockTime?: number; // in seconds
}

export const BlockCounter = ({
  currentBlock,
  targetBlock,
  blockTime = 12, // default block time of 12 seconds
}: BlockCounterProps) => {
  const [blocksRemaining, setBlocksRemaining] = useState(
    targetBlock - currentBlock
  );
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const totalSeconds = blocksRemaining * blockTime;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const interval = setInterval(() => {
      setBlocksRemaining((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
      setTimeRemaining(calculateTimeRemaining());
    }, blockTime * 1000);

    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(interval);
  }, [blocksRemaining, blockTime]);

  const progress = Math.max(
    0,
    Math.min(
      100,
      ((targetBlock - currentBlock - blocksRemaining) /
        (targetBlock - currentBlock)) *
        100
    )
  );

  return (
    <Card className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">Block Progress</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{blocksRemaining} blocks remaining</span>
          <span>{timeRemaining}</span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Current: {currentBlock}</span>
          <span>Target: {targetBlock}</span>
        </div>
      </div>
    </Card>
  );
};
