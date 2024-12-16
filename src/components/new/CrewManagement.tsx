"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useCrews } from "@/hooks/new/useCrews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CrewManagement() {
  const { isAuthenticated, userAddress } = useAuth();
  const { getCrew, createCrew, loading, error: crewError } = useCrews();
  const [crews, setCrews] = useState<Record<number, any>>({});
  const [newCrewName, setNewCrewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFetchingCrews, setIsFetchingCrews] = useState(false);
  const [crewsFetched, setCrewsFetched] = useState(false);

  const crewIds = [1, 2, 3];

  useEffect(() => {
    if (isAuthenticated && userAddress) {
      fetchCrews();
    } else {
      setCrews({});
    }
  }, [isAuthenticated, userAddress]);

  const fetchCrews = async () => {
    setError(null);
    setIsFetchingCrews(true);
    const newCrews: Record<number, any> = {};

    for (const id of crewIds) {
      try {
        const crew = await getCrew(id);
        newCrews[id] = crew;
      } catch (err) {
        console.error(`Failed to fetch crew with ID ${id}:`, err);
        newCrews[id] = { error: `Failed to fetch crew with ID ${id}` };
      }
    }

    setCrews(newCrews);
    setIsFetchingCrews(false);
    setCrewsFetched(true);
  };

  const handleCreateCrew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCrewName.trim()) {
      setError("Please enter a crew name");
      return;
    }

    try {
      const newCrew = await createCrew(userAddress!, newCrewName);
      setNewCrewName("");
      setError(null);
      alert(`Crew "${newCrewName}" created successfully!`);
      fetchCrews(); // Refresh the crew list
    } catch (err) {
      setError(
        `Failed to create crew: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Crew Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please connect your wallet to manage crews.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading || (isAuthenticated && !crewsFetched)) {
    return <Button disabled>Loading crews...</Button>;
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Crew Management</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {crewError && <p className="text-red-500 mb-4">{crewError.message}</p>}

        <form onSubmit={handleCreateCrew} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Create New Crew</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="newCrewName">Crew Name</Label>
              <Input
                id="newCrewName"
                value={newCrewName}
                onChange={(e) => setNewCrewName(e.target.value)}
                placeholder="Enter crew name"
              />
            </div>
            <Button type="submit">Create Crew</Button>
          </div>
        </form>

        <h3 className="text-lg font-semibold mb-2">
          Existing Crews (IDs: 1, 2, 3)
        </h3>
        {Object.entries(crews).map(([id, crew]) => (
          <div key={id} className="mb-4">
            <h4 className="text-md font-semibold mb-2">Crew ID: {id}</h4>
            <pre className=" p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(crew, null, 2)}
            </pre>
          </div>
        ))}
        <Button
          onClick={fetchCrews}
          disabled={isFetchingCrews}
          className="mt-4"
        >
          {isFetchingCrews ? "Refreshing..." : "Refresh Crews"}
        </Button>
      </CardContent>
    </Card>
  );
}
