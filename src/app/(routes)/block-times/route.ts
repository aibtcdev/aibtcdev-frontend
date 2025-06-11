import { NextResponse } from "next/server";

export const runtime = "edge";

async function fetchBlockData(
  blockNumber: number,
  baseURL: string,
  apiKey: string
) {
  const response = await fetch(
    `${baseURL}/extended/v2/burn-blocks/${blockNumber}`,
    {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey || "",
      },
      // USING force-cache won't work on cloudflare deployment
      next: {
        revalidate: 1200, // Cache for 20 minutes (1200 seconds)
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data.burn_block_time_iso;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startBlock = Number.parseInt(searchParams.get("startBlock") || "0");
  const endBlock = Number.parseInt(searchParams.get("endBlock") || "0");

  if (!startBlock || !endBlock) {
    return NextResponse.json(
      { error: "startBlock and endBlock parameters are required" },
      { status: 400 }
    );
  }

  const baseURL =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? "https://api.testnet.hiro.so"
      : "https://api.hiro.so";

  const apiKey = process.env.HIRO_API_KEY || "";

  try {
    const [startBlockData, endBlockData] = await Promise.all([
      fetchBlockData(startBlock, baseURL, apiKey),
      fetchBlockData(endBlock, baseURL, apiKey),
    ]);

    // Set cache-control headers for the response
    const response = NextResponse.json({
      startBlockTime: startBlockData,
      endBlockTime: endBlockData,
    });

    // Add cache headers for Cloudflare
    response.headers.set("Cache-Control", "public, max-age=600");

    return response;
  } catch (error) {
    console.error("Error fetching block times:", error);
    return NextResponse.json(
      { error: "Failed to fetch block times" },
      { status: 500 }
    );
  }
}
