import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

interface CrewMetrics {
  total_crews: number;
  crews_by_date: {
    [date: string]: string[];
  };
}

interface CrewData {
  created_at: string;
  name: string;
}

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<CrewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const { data: crews, error: crewsError } = await supabase
        .from("crews")
        .select("created_at,name")
        .order("created_at", { ascending: true });

      if (crewsError) {
        throw crewsError;
      }

      const crews_by_date: { [key: string]: string[] } = {};
      crews?.forEach((crew: CrewData) => {
        const date = crew.created_at.split("T")[0];
        if (!crews_by_date[date]) {
          crews_by_date[date] = [];
        }
        crews_by_date[date].push(crew.name);
      });

      setMetrics({
        total_crews: crews?.length || 0,
        crews_by_date,
      });
    } catch (error: unknown) {
      console.error("Error fetching metrics:", error);
      setError("Failed to fetch metrics. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getChartData = () => {
    if (!metrics) return [];

    return Object.entries(metrics.crews_by_date)
      .map(([date, crews]) => ({
        date,
        count: crews.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return {
    metrics,
    loading,
    error,
    chartData: getChartData(),
  };
}
