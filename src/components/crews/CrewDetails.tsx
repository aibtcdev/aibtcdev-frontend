"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useCrews, Crew, CronConfig, CrewFormData } from "@/hooks/new/useCrews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface CrewDetailsProps {
  crewId: string;
}

export function CrewDetails({ crewId }: CrewDetailsProps) {
  const { isAuthenticated, userAddress } = useAuth();
  const {
    getCrew,
    updateCrew,
    getCronConfig,
    // createCronConfig,
    updateCronConfig,
    toggleCron,
    loading,
    error,
  } = useCrews();

  const [crew, setCrew] = useState<Crew | null>(null);
  const [cronConfig, setCronConfig] = useState<CronConfig | null>(null);
  const [formData, setFormData] = useState<CrewFormData>({
    crew_name: "",
    crew_description: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [cronSchedule, setCronSchedule] = useState("");

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [crewData, cronData] = await Promise.all([
        getCrew(parseInt(crewId, 10)),
        getCronConfig(parseInt(crewId, 10)).catch(() => null),
      ]);

      setCrew(crewData);
      setCronConfig(cronData);
      if (cronData) {
        setCronSchedule(cronData.schedule);
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
  }, [crewId, isAuthenticated, userAddress, getCrew, getCronConfig]);

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

  //   const handleCronToggle = async (enabled: boolean) => {
  //     if (!crew) return;
  //     try {
  //         if (!cronConfig && enabled) {
  //             const profileId = localStorage.getItem("stxAddress");
  //             if (!profileId) {
  //                 throw new Error("Profile ID not found");
  //             }
  //             const newConfig = await createCronConfig({
  //                 profile_id: profileId,
  //                 crew_id: crewId,
  //                 cron_enabled: true,
  //             });
  //             setCronConfig(newConfig);
  //             setCronSchedule(newConfig.schedule);
  //         } else if (cronConfig) {
  //             const updatedConfig = await toggleCron(crew.id, enabled);
  //             setCronConfig(updatedConfig);
  //         }
  //     } catch (err) {
  //         setLocalError(
  //             err instanceof Error ? err : new Error("Failed to toggle cron")
  //         );
  //         console.error("Error toggling cron:", err);
  //     }
  // };

  //   const handleCronScheduleUpdate = async () => {
  //     if (!crew || !cronSchedule) return;
  //     try {
  //         const updatedConfig = cronConfig
  //             ? await updateCronConfig(crew.id, cronSchedule)
  //             : await createCronConfig({
  //                 profile_id: crew.profile_id,
  //                 crew_id: crewId,
  //                 cron_enabled: true,
  //             });
  //         setCronConfig(updatedConfig);
  //     } catch (err) {
  //         setLocalError(
  //             err instanceof Error ? err : new Error("Failed to update cron schedule")
  //         );
  //         console.error("Error updating cron schedule:", err);
  //     }
  // };

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (localError || error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">
            Error: {(localError || error)?.message}
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
            {/* <Switch
              id="cronToggle"
              checked={cronConfig?.enabled ?? false}
              onCheckedChange={handleCronToggle}
            /> */}
          </div>

          {(cronConfig?.enabled ||
            (!cronConfig && crew?.crew_is_cron === 1)) && (
            <div>
              <Label htmlFor="cronSchedule">Cron Schedule</Label>
              <div className="flex gap-2">
                <Input
                  id="cronSchedule"
                  value={cronSchedule}
                  onChange={(e) => setCronSchedule(e.target.value)}
                  placeholder="Enter cron schedule (e.g., * * * * *)"
                />

                {/* YET TO IMPLEMENT */}
                {/* <button
                  onClick={handleCronScheduleUpdate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                  Save
                </button> */}
              </div>
              {cronConfig?.last_run && (
                <p className="text-sm text-gray-500 mt-1">
                  Last run: {new Date(cronConfig.last_run).toLocaleString()}
                </p>
              )}
              {cronConfig?.next_run && (
                <p className="text-sm text-gray-500">
                  Next run: {new Date(cronConfig.next_run).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
