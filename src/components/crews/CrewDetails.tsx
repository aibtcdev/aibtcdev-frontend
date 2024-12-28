"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useCrews, Crew, CrewFormData } from "@/hooks/new/useCrews";
import { useCrons } from "@/hooks/new/useCrons";
import type { CronResponse } from "@/hooks/new/useCrons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CrewDetailsProps {
  crewId: string;
}

export function CrewDetails({ crewId }: CrewDetailsProps) {
  const { isAuthenticated, userAddress } = useAuth();
  const { getCrew, updateCrew, error: crewError } = useCrews();
  const {
    getCronsByCrew,
    createCron,
    updateCronInput,
    toggleCronStatus,
    loading: cronLoading,
    error: cronError,
  } = useCrons();

  const [crew, setCrew] = useState<Crew | null>(null);
  const [cronConfig, setCronConfig] = useState<CronResponse | null>(null);
  const [formData, setFormData] = useState<CrewFormData>({
    crew_name: "",
    crew_description: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [cronInput, setCronInput] = useState("");

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [crewData, cronsData] = await Promise.all([
        getCrew(parseInt(crewId, 10)),
        getCronsByCrew(parseInt(crewId, 10)),
      ]);

      setCrew(crewData);
      if (cronsData && cronsData.length > 0) {
        setCronConfig(cronsData[0]);
        setCronInput(cronsData[0].cron_input);
      }
      setFormData({
        crew_name: crewData.crew_name,
        crew_description: crewData.crew_description || "",
      });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err : new Error("Failed to fetch data")
      );
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [crewId, isAuthenticated, userAddress, getCrew, getCronsByCrew]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (
    field: keyof CrewFormData,
    value: string | number
  ) => {
    if (!crew) return;
    try {
      const updatedCrew = await updateCrew(crew.id, { [field]: value });
      setCrew(updatedCrew);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err : new Error("Failed to update crew")
      );
      console.error("Error updating crew:", err);
    }
  };

  const handleInputChange = (field: keyof CrewFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputBlur = (field: keyof CrewFormData) => {
    if (formData[field] !== crew?.[field]) {
      handleUpdate(field, formData[field] as string);
    }
  };

  const handleCronToggle = async (enabled: boolean) => {
    if (!crew) return;
    try {
      if (!cronConfig && enabled) {
        const newCron = await createCron({
          profile_id: userAddress,
          crew_id: crewId,
          cron_enabled: enabled ? 1 : 0,
          cron_input: cronInput,
        });
        setCronConfig(newCron);
      } else if (cronConfig) {
        const updatedCron = await toggleCronStatus(cronConfig.id, enabled);
        setCronConfig(updatedCron);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err : new Error("Failed to toggle cron")
      );
      console.error("Error toggling cron:", err);
    }
  };

  const handleCronInputUpdate = async () => {
    if (!crew || !cronConfig) return;
    try {
      const updatedCron = await updateCronInput(cronConfig.id, cronInput);
      setCronConfig(updatedCron);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err : new Error("Failed to update cron input")
      );
      console.error("Error updating cron input:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crew Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please connect your wallet to manage crew settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || cronLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (localError || crewError || cronError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">
            Error: {(localError || crewError || cronError)?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crew Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="crewName">Crew Name</Label>
            <Input
              id="crewName"
              value={formData.crew_name}
              onChange={(e) => handleInputChange("crew_name", e.target.value)}
              onBlur={() => handleInputBlur("crew_name")}
              placeholder="Enter crew name"
            />
          </div>

          <div>
            <Label htmlFor="crewDescription">Description</Label>
            <Textarea
              id="crewDescription"
              value={formData.crew_description}
              onChange={(e) =>
                handleInputChange("crew_description", e.target.value)
              }
              onBlur={() => handleInputBlur("crew_description")}
              placeholder="Enter crew description"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cronToggle">Cron Enabled</Label>
              <p className="text-sm text-gray-500">
                Enable scheduled executions
              </p>
            </div>
            <Switch
              id="cronToggle"
              checked={cronConfig?.cron_enabled === 1}
              onCheckedChange={handleCronToggle}
            />
          </div>

          {cronConfig?.cron_enabled === 1 && (
            <div>
              <Label htmlFor="cronInput">Cron Input</Label>
              <div className="flex gap-2">
                <Input
                  id="cronInput"
                  value={cronInput}
                  onChange={(e) => setCronInput(e.target.value)}
                  placeholder="Enter cron input"
                />
                <Button onClick={handleCronInputUpdate}>Save Input</Button>
              </div>
              {cronConfig?.created_at && (
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(cronConfig.created_at).toLocaleString()}
                </p>
              )}
              {cronConfig?.updated_at && (
                <p className="text-sm text-gray-500">
                  Last updated:{" "}
                  {new Date(cronConfig.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
