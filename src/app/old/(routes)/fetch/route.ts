import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address parameter is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://cache.aibtc.dev/hiro-api/extended/v1/address/${address}/balances`, {
      headers: {
        "Accept": "application/json",
        "X-API-Key": process.env.HIRO_API_KEY || "",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch data from Hiro API" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching data from Hiro API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
