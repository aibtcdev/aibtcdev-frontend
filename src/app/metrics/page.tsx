"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
import MetricsView from "@/components/metrics/MetricsView";
import { fetchAllUserMetrics } from "@/services/metrics.service";

export const runtime = "edge";

export default function MetricsPage() {
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userMetrics"],
    queryFn: () => fetchAllUserMetrics(),
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[100vh] w-full">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Metrics</h2>
          <p className="text-muted-foreground">
            Failed to load user metrics. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return <MetricsView metrics={metrics || []} />;
}
