"use client";
import React, { useEffect, useState } from "react";
import { MetricCard } from "./ProposalSidebar";
import { Clock } from "lucide-react";
import { ProposalWithDAO } from "@/types";
import { useBitcoinBlockHeight } from "@/hooks/useBitcoinBlockHeight";

interface ProposalTimeMetricProps {
  proposal: ProposalWithDAO;
}

const ESTIMATED_BLOCK_TIME_MAINNET = 10 * 60 * 1000; // 10 minutes in milliseconds
const ESTIMATED_BLOCK_TIME_TESTNET = 4 * 60 * 1000; // 4 minutes in milliseconds

export function ProposalTimeMetric({ proposal }: ProposalTimeMetricProps) {
  const [timeDetails, setTimeDetails] = useState<{
    displayValue: string;
    variant: "default" | "warning" | "success";
  }>({ displayValue: "Loading...", variant: "default" });

  const { blockHeight } = useBitcoinBlockHeight();

  useEffect(() => {
    if (proposal.status === "pending") {
      setTimeDetails({
        displayValue: "Voting not started",
        variant: "default",
      });
      return;
    }

    const fetchBlockTimes = async () => {
      try {
        const response = await fetch(
          `/block-times?startBlock=${proposal.vote_start}&endBlock=${proposal.vote_end}`
        );
        const data = await response.json();

        const now = Date.now();
        let displayValue: string;
        let variant: "default" | "warning" | "success" = "default";

        const formatTimeLeft = (ms: number) => {
          if (ms <= 0) return "Ended";
          const days = Math.floor(ms / (24 * 60 * 60 * 1000));
          const hours = Math.floor(
            (ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
          );
          const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

          if (days > 0) return `${days}d ${hours}h left`;
          if (hours > 0) return `${hours}h ${minutes}m left`;
          return `${minutes}m left`;
        };

        if (data.endBlockTime) {
          const voteEnd = new Date(data.endBlockTime).getTime();
          timeLeft = voteEnd - now;
          displayValue = formatTimeLeft(timeLeft);
          variant = timeLeft < 24 * 60 * 60 * 1000 ? "warning" : "success";
        } else if (data.startBlockTime) {
          const voteStart = new Date(data.startBlockTime).getTime();
          const totalVoteBlocks =
            Number(proposal.vote_end) - Number(proposal.vote_start);
          const estimatedTimePerBlock =
            process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
              ? ESTIMATED_BLOCK_TIME_TESTNET
              : ESTIMATED_BLOCK_TIME_MAINNET;
          const estimatedVoteDuration = totalVoteBlocks * estimatedTimePerBlock;
          const estimatedEndTime = voteStart + estimatedVoteDuration;
          timeLeft = estimatedEndTime - now;
          displayValue = `~${formatTimeLeft(timeLeft)}`;
          variant = timeLeft < 24 * 60 * 60 * 1000 ? "warning" : "success";
        } else {
          displayValue = "Estimating...";
          variant = "default";
        }

        setTimeDetails({ displayValue, variant });
      } catch (error) {
        console.error("Failed to fetch block times:", error);
        setTimeDetails({
          displayValue: "Error fetching time",
          variant: "warning",
        });
      }
    };

    if (blockHeight > 0) {
      fetchBlockTimes();
    }
  }, [proposal, blockHeight]);

  return (
    <MetricCard
      icon={<Clock className="h-4 w-4" />}
      label="Time"
      value={timeDetails.displayValue}
      variant={timeDetails.variant}
    />
  );
}
