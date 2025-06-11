"use client";

import { Loader } from "@/components/reusables/Loader";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { CrewChart } from "@/components/admin/metrics/CrewChart";
import { MetricsHeader } from "@/components/admin/metrics/MetricsHeader";

export default function AdminMetrics() {
  const { metrics, loading, error, chartData } = useAdminMetrics();

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

  return (
    <div className="container mx-auto p-4">
      <MetricsHeader totalCrews={metrics.total_crews} />
      <CrewChart data={chartData} />
    </div>
  );
}
