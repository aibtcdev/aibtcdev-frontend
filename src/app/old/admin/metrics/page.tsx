"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loader } from "@/components/reusables/Loader";

interface CrewMetrics {
  total_crews: number;
  crews_by_date: {
    [date: string]: string[];
  };
}

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState<CrewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/crews_metrics`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch metrics");
        }
        const data: CrewMetrics = await response.json();
        setMetrics(data);
      } catch (error: unknown) {
        setError("Failed to fetch metrics. Please try again later.");
        console.error(
          "Error fetching metrics:",
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex justify-center items-center h-screen">
        No data available
      </div>
    );
  }

  const chartData = Object.entries(metrics.crews_by_date)
    .map(([date, crews]) => ({
      date,
      count: crews.length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="container mx-auto p-4">
      <p className="text-4xl font-bold">
        Total Crews so far: {metrics.total_crews}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Crews Created by Date</CardTitle>
          <CardDescription>
            Number of crews created on each date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Number of Crews",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[400px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  name="Number of Crews"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
