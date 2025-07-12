"use server";

import { cache } from "react";

// Cache the individual block fetch operation
const fetchBlockData = cache(
  async (blockNumber: number, baseURL: string, apiKey: string) => {
    const response = await fetch(
      `${baseURL}/extended/v2/burn-blocks/${blockNumber}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": apiKey || "",
        },
        // Set cache time to 10 minutes (600 seconds)
        next: {
          revalidate: 600, // Cache for 10 minutes
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.burn_block_time_iso;
    }
    return null;
  }
);

// Cache the combined operation
export const fetchBlockTimes = cache(
  async (startBlock: number, endBlock: number) => {
    const baseURL =
      process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
        ? "https://api.testnet.hiro.so"
        : "https://api.hiro.so";

    const apiKey = process.env.HIRO_API_KEY || "";

    try {
      // Fetch both blocks in parallel for better performance
      const [startBlockData, endBlockData] = await Promise.all([
        fetchBlockData(startBlock, baseURL, apiKey),
        fetchBlockData(endBlock, baseURL, apiKey),
      ]);

      const result = {
        startBlockTime: startBlockData,
        endBlockTime: endBlockData,
      };

      return result;
    } catch (error) {
      console.error("Error fetching block times:", error);
      return {
        startBlockTime: null,
        endBlockTime: null,
      };
    }
  }
);
