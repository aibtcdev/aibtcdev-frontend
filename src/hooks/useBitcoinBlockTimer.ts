import { useState, useEffect } from "react";

interface BitcoinBlockTimer {
  timeRemaining: string;
  nextBlockNumber: number | null;
  currentBlockNumber: number | null;
  isTimeUp: boolean;
}

/**
 * Custom hook to calculate time remaining until next Bitcoin block
 * Based on updated_at timestamp + 10 minutes estimation
 */
export function useBitcoinBlockTimer(
  chainStateUpdatedAt: string | null,
  currentBitcoinBlock: number | null
): BitcoinBlockTimer {
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--");
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!chainStateUpdatedAt || !currentBitcoinBlock) {
      setTimeRemaining("--:--");
      setIsTimeUp(false);
      return;
    }

    const updateTimer = () => {
      try {
        // Parse the PostgreSQL timestamp format: "2025-07-12 22:05:13.735313+00"
        const updatedAt = new Date(chainStateUpdatedAt);
        const now = new Date();

        // Validate that the date parsing was successful
        if (isNaN(updatedAt.getTime())) {
          console.error("Invalid timestamp format:", chainStateUpdatedAt);
          setTimeRemaining("--:--");
          setIsTimeUp(false);
          return;
        }

        const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds

        // Calculate when the next block should arrive (updated_at + 10 minutes)
        const nextBlockTime = new Date(updatedAt.getTime() + tenMinutesInMs);
        const timeDiff = nextBlockTime.getTime() - now.getTime();

        // Show current block updated_at timestamp
        console.log("🕐 CURRENT BLOCK UPDATED_AT:", chainStateUpdatedAt);
        console.log("📅 Parsed timestamp:", updatedAt.toISOString());
        console.log("⏰ Current time:", now.toISOString());
        console.log(
          "⏳ Minutes since last update:",
          Math.floor((now.getTime() - updatedAt.getTime()) / 1000 / 60)
        );

        if (timeDiff <= 0) {
          // Check how long ago the update was
          const minutesSinceUpdate = Math.floor(
            (now.getTime() - updatedAt.getTime()) / 1000 / 60
          );

          if (minutesSinceUpdate > 15) {
            // If it's been more than 15 minutes, show that we're waiting for chain state update
            setTimeRemaining("--:--");
            console.warn(
              `Chain state is ${minutesSinceUpdate} minutes old. Waiting for update...`
            );
          } else {
            setTimeRemaining("00:00");
          }
          setIsTimeUp(true);
          return;
        }

        setIsTimeUp(false);

        // Convert milliseconds to minutes and seconds
        const totalSeconds = Math.floor(timeDiff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Format as MM:SS
        const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        setTimeRemaining(formattedTime);
      } catch (error) {
        console.error("Error in Bitcoin block timer:", error);
        setTimeRemaining("--:--");
        setIsTimeUp(false);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [chainStateUpdatedAt, currentBitcoinBlock]);

  return {
    timeRemaining,
    nextBlockNumber: currentBitcoinBlock ? currentBitcoinBlock + 1 : null,
    currentBlockNumber: currentBitcoinBlock,
    isTimeUp,
  };
}
