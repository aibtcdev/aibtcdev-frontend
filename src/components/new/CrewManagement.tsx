"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useCrews } from "@/hooks/new/useCrews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface Crew {
  id: number;
  created_at: string;
  updated_at: string;
  profile_id: string;
  crew_name: string;
  crew_description: string | null;
  crew_executions: number;
  crew_is_public: 0 | 1;
  crew_is_cron: 0 | 1;
}

export function CrewManagement() {
  const router = useRouter();
  const { isAuthenticated, userAddress } = useAuth();
  const { getCrew, createCrew, loading, error: crewError } = useCrews();

  const [crews, setCrews] = useState<Record<number, Crew | { error: string }>>(
    {}
  );
  const [newCrewName, setNewCrewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFetchingCrews, setIsFetchingCrews] = useState(false);
  const [crewsFetched, setCrewsFetched] = useState(false);

  const fetchCrews = useCallback(async () => {
    // Move crewIds inside the useCallback
    const crewIds = [1, 2, 3];

    setError(null);
    setIsFetchingCrews(true);
    const newCrews: Record<number, Crew | { error: string }> = {};

    for (const id of crewIds) {
      try {
        const response = await getCrew(id);
        const crew = response.crew;
        newCrews[id] = crew;
      } catch (err) {
        console.error(`Failed to fetch crew with ID ${id}:`, err);
        newCrews[id] = {
          error: `Failed to fetch crew with ID ${id}`,
          id,
        };
      }
    }

    setCrews(newCrews);
    setIsFetchingCrews(false);
    setCrewsFetched(true);
  }, [getCrew]);

  useEffect(() => {
    if (isAuthenticated && userAddress) {
      fetchCrews();
    } else {
      setCrews({});
    }
  }, [isAuthenticated, userAddress, fetchCrews]);

  const handleCreateCrew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCrewName.trim()) {
      setError("Please enter a crew name");
      return;
    }

    try {
      setError(null);
      const profileId = localStorage.getItem("stxAddress");
      if (!profileId) {
        throw new Error("Profile ID not found");
      }
      await createCrew(profileId, newCrewName, newDescription);
      alert(`Crew "${newCrewName}" created successfully!`);
      setNewCrewName("");
      setNewDescription("");
      fetchCrews(); // Refresh the crew list
    } catch (err) {
      setError(
        `Failed to create crew: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleManageCrew = (crewId: number) => {
    router.push(`/crews/${crewId}/manage`);
  };

  const renderCrewContent = (crew: Crew | { error: string }) => {
    if ("error" in crew) {
      return (
        <div className="p-4 rounded-md">
          <p className="text-red-600">{crew.error}</p>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-md">
        <div className="grid grid-cols-2 gap-2">
          <p>
            <strong>Crew Name:</strong> {crew.crew_name}
          </p>
          <p>
            <strong>Profile ID:</strong> {crew.profile_id}
          </p>
          <p>
            <strong>Created At:</strong> {crew.created_at}
          </p>
          <p>
            <strong>Executions:</strong> {crew.crew_executions}
          </p>
          <p>
            <strong>Public:</strong> {crew.crew_is_public ? "Yes" : "No"}
          </p>
          <p>
            <strong>Cron Enabled:</strong> {crew.crew_is_cron ? "Yes" : "No"}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {crew.crew_description || "No description"}
          </p>
          <div className="col-span-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleManageCrew(crew.id)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Crew Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please connect your wallet to manage crews.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading || (isAuthenticated && !crewsFetched)) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading crews...
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Crew Management</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {crewError && <p className="text-red-500 mb-4">{crewError.message}</p>}

        <form onSubmit={handleCreateCrew} className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold">Create New Crew</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="newCrewName">Crew Name</Label>
              <Input
                id="newCrewName"
                value={newCrewName}
                onChange={(e) => setNewCrewName(e.target.value)}
                placeholder="Enter crew name"
              />
              <Label htmlFor="newCrewDescription">Crew Description</Label>
              <Input
                id="newCrewDescription"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter crew description"
              />
            </div>
            <Button type="submit">Create Crew</Button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Existing Crews (IDs: 1, 2, 3)
          </h3>
          {Object.entries(crews).map(([id, crew]) => (
            <div key={id} className="border rounded-md overflow-hidden">
              <div className="p-3 font-semibold">Crew ID: {id}</div>
              {renderCrewContent(crew)}
            </div>
          ))}
        </div>

        <Button
          onClick={fetchCrews}
          disabled={isFetchingCrews}
          className="mt-4 w-full"
          variant="outline"
        >
          {isFetchingCrews ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh Crews"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
