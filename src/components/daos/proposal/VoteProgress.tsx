"use client";
import React from "react";
import { Activity } from "lucide-react";

interface VoteProgressProps {
  votesFor: string;
  votesAgainst: string;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor,
  votesAgainst,
}) => {
  // Check if voting data is available
  if (
    (!votesFor || votesFor.trim() === "") &&
    (!votesAgainst || votesAgainst.trim() === "")
  ) {
    return (
      <div className="p-4 my-4 rounded-lg  flex items-center justify-center text-sm text-muted-foreground border">
        <Activity className="h-4 w-4 mr-2" />
        No voting data available
      </div>
    );
  }

  // Calculate vote counts and percentages
  const yesVotes = (Number.parseFloat(votesFor) || 0) / 1e8;
  const noVotes = (Number.parseFloat(votesAgainst) || 0) / 1e8;
  const totalVotes = yesVotes + noVotes;
  let yesPercent = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50;
  let noPercent = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 50;
  const minDisplay = 5;
  if (yesVotes > 0 && yesPercent < minDisplay) yesPercent = minDisplay;
  if (noVotes > 0 && noPercent < minDisplay) noPercent = minDisplay;
  const sum = yesPercent + noPercent;
  if (sum > 100) {
    const factor = 100 / sum;
    yesPercent *= factor;
    noPercent *= factor;
  }

  // Format vote numbers with appropriate suffixes for better readability
  const formatVotes = (votes: number): string => {
    if (votes === 0) return "0";
    if (votes < 1) return votes.toFixed(2);
    if (votes < 10) return votes.toFixed(1);
    if (votes < 1000) return Math.round(votes).toString();
    if (votes < 1000000) return (votes / 1000).toFixed(1) + "K";
    return (votes / 1000000).toFixed(1) + "M";
  };

  return (
    <div className="rounded-lg p-3 sm:p-4 my-4 border">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Activity className="h-4 w-4" />
        <h4 className="font-medium text-sm">Voting Progress</h4>
      </div>

      {/* Vote percentages displayed above the bar on mobile */}
      <div className="flex justify-between text-xs mb-1 sm:hidden">
        <span className="font-medium text-green-600">
          {yesPercent.toFixed(1)}%
        </span>
        <span className="font-medium text-red-600">
          {noPercent.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-6 sm:h-8 w-full rounded-full bg-secondary/10 overflow-hidden">
        <div
          className="absolute left-0 h-full bg-green-500 flex items-center justify-start text-white text-xs sm:text-sm font-bold px-2"
          style={{ width: `${yesPercent}%` }}
        >
          {yesPercent >= 15 && `${formatVotes(yesVotes)} Token Yes`}
        </div>
        <div
          className="absolute right-0 h-full bg-red-500 flex items-center justify-end text-white text-xs sm:text-sm font-bold px-2"
          style={{ width: `${noPercent}%` }}
        >
          {noPercent >= 15 && `${formatVotes(noVotes)} Token No`}
        </div>
      </div>

      {/* Details row under the progress bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex space-x-4 mb-1 sm:mb-0">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
            Yes: {formatVotes(yesVotes)} Tokens
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
            No: {formatVotes(noVotes)} Tokens
          </span>
        </div>
        <div>
          Total: {formatVotes(totalVotes)} token vote
          {totalVotes !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
};

export default VoteProgress;
