"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useCrews } from "@/hooks/new/useCrews";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, PlusIcon, Globe, Lock, Clock, Loader2 } from "lucide-react";

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

export function CrewList() {
  const router = useRouter();
  const { isAuthenticated, userAddress } = useAuth();
  const { getCrew, createCrew, loading, error: crewError } = useCrews();

  const [crews, setCrews] = useState<Record<number, Crew | { error: string }>>(
    {}
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFetchingCrews, setIsFetchingCrews] = useState(false);
  const [crewsFetched, setCrewsFetched] = useState(false);

  // NEEDS TO BE UPDATED TO GET LIST OF ALL THE CREWS FROM PROFILE ID
  const crewIds = [1, 2, 3];

  const fetchCrews = useCallback(async () => {
    if (!isAuthenticated || !userAddress) return;

    setError(null);
    setIsFetchingCrews(true);
    const newCrews: Record<number, Crew | { error: string }> = {};

    try {
      for (const id of crewIds) {
        try {
          const response = await getCrew(id);
          newCrews[id] = response.crew;
        } catch (err) {
          console.error(`Failed to fetch crew with ID ${id}:`, err);
          newCrews[id] = {
            error: `Failed to fetch crew with ID ${id}`,
            id,
          };
        }
      }

      setCrews(newCrews);
    } catch (err) {
      console.error("Failed to fetch crews:", err);
      setError("Failed to fetch crews");
    } finally {
      setIsFetchingCrews(false);
      setCrewsFetched(true);
    }
  }, [getCrew, isAuthenticated, userAddress]);

  useEffect(() => {
    if (isAuthenticated && userAddress && !crewsFetched && !isFetchingCrews) {
      fetchCrews();
    }
  }, [isAuthenticated, userAddress, crewsFetched, isFetchingCrews, fetchCrews]);

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
      setIsDialogOpen(false);
      setNewCrewName("");
      setNewDescription("");
      fetchCrews();
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
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">
          Please connect your wallet to manage crews.
        </p>
      </div>
    );
  }

  if (loading || (isAuthenticated && !crewsFetched && isFetchingCrews)) {
    return (
      <div className="container mx-auto p-4 flex justify-center">
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading crews...
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-zinc-950/10 pb-6 dark:border-white/10">
        <h1 className="text-2xl font-bold">
          Your Crews (It is static and fetched using crewid 1,2,3 for now)
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" /> Add Crew
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Crew</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCrew} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crew-name">Name</Label>
                <Input
                  id="crew-name"
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  placeholder="Enter crew name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-description">Description</Label>
                <Input
                  id="crew-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter crew description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Crew</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {crewError && <p className="text-red-500 mb-4">{crewError.message}</p>}

      <div className="mt-6">
        {/* Desktop view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-full">Description</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(crews).map(([id, crew]) => {
                if ("error" in crew) {
                  return (
                    <TableRow key={id}>
                      <TableCell colSpan={4}>
                        <p className="text-red-600">{crew.error}</p>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">
                      {crew.crew_name}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {crew.crew_description || "No description"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {crew.crew_is_public ? (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {crew.crew_is_public ? "Public" : "Private"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {crew.crew_is_cron === 1 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cron Enabled</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/crews/${crew.id}/manage`)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {Object.entries(crews).map(([id, crew]) => {
            if ("error" in crew) {
              return (
                <div
                  key={id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <p className="text-red-600">{crew.error}</p>
                </div>
              );
            }

            return (
              <div
                key={id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{crew.crew_name}</h3>
                    <div className="flex items-center gap-2">
                      {crew.crew_is_public ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {crew.crew_is_cron === 1 && (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {crew.crew_description || "No description"}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/crews/${crew.id}/manage`)}
                      className="w-full"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Manage Crew
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
