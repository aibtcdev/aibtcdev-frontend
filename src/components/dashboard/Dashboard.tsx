"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader } from "@/components/reusables/Loader";

interface DashboardStats {
  totalCrews: number;
  totalJobs: number;
  jobsPerDay: { date: string; jobs: number }[];
  crewActivity: { name: string; jobs: number }[];
}

// Mock data
const mockData: DashboardStats = {
  totalCrews: 12,
  totalJobs: 456,
  jobsPerDay: [
    { date: "2024-01-01", jobs: 15 },
    { date: "2024-01-02", jobs: 20 },
    { date: "2024-01-03", jobs: 18 },
    { date: "2024-01-04", jobs: 25 },
    { date: "2024-01-05", jobs: 22 },
    { date: "2024-01-06", jobs: 30 },
    { date: "2024-01-07", jobs: 28 },
  ],
  crewActivity: [
    { name: "AI Crew", jobs: 120 },
    { name: "Data Crew", jobs: 85 },
    { name: "Dev Crew", jobs: 95 },
    { name: "Research Crew", jobs: 75 },
    { name: "Support Crew", jobs: 81 },
  ],
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchStats = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      setStats(mockData);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  return (
    <>
      {/* Coming Soon Overlay */}

      {/* Dashboard Content */}
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Crews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCrews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Jobs per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  stats.jobsPerDay.reduce((acc, day) => acc + day.jobs, 0) /
                    stats.jobsPerDay.length
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Over Time</CardTitle>
              <CardDescription>Number of jobs run per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.jobsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crew Activity</CardTitle>
              <CardDescription>Jobs run by each crew</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.crewActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
