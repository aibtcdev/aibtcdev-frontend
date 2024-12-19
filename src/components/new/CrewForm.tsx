"use client";

import React, { useState } from "react";
import { useCrews } from "@/hooks/new/useCrews";
import { useAuth } from "@/hooks/new/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CrewFormProps {
  crewId?: number;
  initialName?: string;
  initialDescription?: string;
  onSuccess: () => void;
}

export function CrewForm({
  crewId,
  initialName = "",
  initialDescription = "",
  onSuccess,
}: CrewFormProps) {
  const [crewName, setCrewName] = useState(initialName);
  const [crewDescription, setCrewDescription] = useState(initialDescription);
  const { createCrew, updateCrew, deleteCrew, loading, error } = useCrews();
  const { userAddress } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      if (crewId) {
        await updateCrew(crewId, {
          crew_name: crewName,
          crew_description: crewDescription,
        });
        alert(`Crew "${crewName}" updated successfully!`);
      } else {
        await createCrew(userAddress, crewName, crewDescription);
        alert(`Crew "${crewName}" created successfully!`);
      }
      setCrewName("");
      setCrewDescription("");
      onSuccess();
    } catch (err) {
      console.error("Failed to create/update crew:", err);
    }
  };

  const handleDelete = async () => {
    if (!crewId) return;
    if (window.confirm("Are you sure you want to delete this crew?")) {
      try {
        await deleteCrew(crewId);
        alert("Crew deleted successfully!");
        onSuccess();
      } catch (err) {
        console.error("Failed to delete crew:", err);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{crewId ? "Edit Crew" : "Create New Crew"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="crewName">Crew Name</Label>
            <Input
              id="crewName"
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="Enter crew name"
              required
            />
          </div>
          <div>
            <Label htmlFor="crewDescription">Crew Description</Label>
            <Textarea
              id="crewDescription"
              value={crewDescription}
              onChange={(e) => setCrewDescription(e.target.value)}
              placeholder="Enter crew description"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {crewId ? "Updating..." : "Creating..."}
              </>
            ) : crewId ? (
              "Update Crew"
            ) : (
              "Create Crew"
            )}
          </Button>
          {crewId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Crew
            </Button>
          )}
        </form>
        {error && <p className="text-red-500 mt-2">{error.message}</p>}
      </CardContent>
    </Card>
  );
}
