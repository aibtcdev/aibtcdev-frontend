"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { CrewManagement } from "@/components/crews/CrewManagement";
import { CloneTradingAnalyzer } from "@/components/crews/CloneTradingAnalyzer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import DashboardChat from "./DashboardChat";
import { Crew } from "@/types/supabase";

export default function Dashboard() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [hasClonedAnalyzer, setHasClonedAnalyzer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);

  const fetchCrews = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("crews")
        .select("id, name, description, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setCrews(data || []);
    } catch (err) {
      console.error("Error fetching crews:", err);
      setError("Failed to fetch crews");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkClonedAnalyzer = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .eq("profile_id", user.id)
        .eq("name", "Trading Analyzer");

      if (error) {
        throw error;
      }

      setHasClonedAnalyzer(data && data.length > 0);
    } catch (err) {
      console.error("Error checking for cloned analyzer:", err);
      setError("Failed to check cloned analyzer status");
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      await Promise.all([fetchCrews(), checkClonedAnalyzer()]);
    };

    initializeDashboard();
  }, [fetchCrews, checkClonedAnalyzer]);

  const handleCrewSelect = useCallback((crew: Crew | null) => {
    setSelectedCrew(crew);
  }, []);

  const handleCloneComplete = useCallback(() => {
    setHasClonedAnalyzer(true);
    fetchCrews();
  }, [fetchCrews]);

  const handleCrewsUpdated = useCallback(
    (updatedCrews: Crew[]) => {
      setCrews(updatedCrews);
      if (updatedCrews.length === 0) {
        setSelectedCrew(null);
      }
      checkClonedAnalyzer();
    },
    [checkClonedAnalyzer]
  );

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Chat with your Crews</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardChat selectedCrew={selectedCrew} />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="mt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading crews...</p>
          ) : crews.length > 0 ? (
            <CrewManagement
              initialCrews={crews}
              onCrewSelect={handleCrewSelect}
              onCrewUpdate={handleCrewsUpdated}
              selectedCrew={selectedCrew}
            />
          ) : (
            <p className="text-muted-foreground">
              You don&apos;t have any crews yet. Clone our starter crew.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          {!isLoading && crews.length === 0 && !hasClonedAnalyzer && (
            <CloneTradingAnalyzer
              onCloneComplete={handleCloneComplete}
              disabled={false}
            />
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
