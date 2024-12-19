"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import AgentManagement from "@/components/agents/AgentManagement";
import TaskManagement from "@/components/tasks/TaskManagement";
import { Card, CardContent } from "@/components/ui/card";
import { Agent, CrewWithCron, Task } from "@/types/supabase";
import { Switch } from "@/components/ui/switch";

import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { HelpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const runtime = "edge";

export default function CrewDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  // State
  const [crew, setCrew] = useState<CrewWithCron | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    is_public: false,
  });
  const [cronInput, setCronInput] = useState("");
  const [cronEnabled, setCronEnabled] = useState(false);
  const [cronId, setCronId] = useState(0);

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("crew_id", id);

      if (error) throw error;

      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch agents.",
        variant: "destructive",
      });
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) {
      fetchAgents();
    }
  }, [id, fetchAgents]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("crew_id", id);

      if (error) throw error;

      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks.",
        variant: "destructive",
      });
    }
  }, [id, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (user) {
        setCurrentUser(user.id);
      }
    }
    fetchUser();
  }, []);

  // Fetch crew data
  useEffect(() => {
    async function fetchData() {
      try {
        const [crewResponse, agentsResponse, tasksResponse] = await Promise.all(
          [
            supabase
              .from("crews")
              .select(`*, crons(id, enabled, input, created_at)`)
              .eq("id", id)
              .single(),
            supabase.from("agents").select("*").eq("crew_id", id),
            supabase.from("tasks").select("*").eq("crew_id", id),
          ]
        );

        if (crewResponse.error) throw crewResponse.error;
        if (agentsResponse.error) throw agentsResponse.error;
        if (tasksResponse.error) throw tasksResponse.error;

        // Process crew data
        const crewData = crewResponse.data;
        console.log("Crew data:", crewData);
        setCrew(crewData);
        setEditForm({
          name: crewData.name,
          description: crewData.description || "",
          is_public: crewData.is_public || false,
        });
        if (crewData.crons?.[0]?.input) {
          setCronId(crewData.crons[0].id);
          setCronEnabled(crewData.crons[0].enabled);
          setCronInput(crewData.crons[0].input);
        }

        setAgents(agentsResponse.data || []);
        setTasks(tasksResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load crew data. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    if (id) {
      fetchData();
    }
  }, [id, toast]);

  // Handlers
  const handleSaveSettings = async () => {
    if (!crew) return;
    setIsSaving(true);
    try {
      // Update crew settings
      const { error: crewError } = await supabase
        .from("crews")
        .update({
          name: editForm.name,
          description: editForm.description,
          is_public: editForm.is_public,
        })
        .eq("id", crew.id);

      if (crewError) throw crewError;

      // Update cron input if it exists
      if (cronId && cronEnabled) {
        const { error: cronError } = await supabase
          .from("crons")
          .update({ input: cronInput })
          .eq("id", cronId);

        if (cronError) throw cronError;
      }

      setCrew({
        ...crew,
        name: editForm.name,
        description: editForm.description,
        is_public: editForm.is_public,
        cron: crew.cron
          ? {
              ...crew.cron,
              input: cronInput,
            }
          : null,
      });

      toast({
        title: "Success",
        description: "Crew settings updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save crew settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAutonomous = async (checked: boolean) => {
    if (!crew || !currentUser) return;

    try {
      if (!cronId && checked) {
        // Create new cron
        const { data: newCron, error: createError } = await supabase
          .from("crons")
          .insert({
            crew_id: crew.id,
            enabled: true,
            profile_id: currentUser,
            input: "",
          })
          .select()
          .single();

        if (createError) throw createError;
        if (newCron) {
          setCrew({
            ...crew,
          });
          setCronId(newCron.id);
          setCronEnabled(true);
          toast({
            title: "Success",
            description: "Autonomous running enabled.",
          });
        }
      } else if (cronId) {
        // Update existing cron
        const { error } = await supabase
          .from("crons")
          .update({ enabled: checked })
          .eq("id", cronId);

        if (error) throw error;

        setCrew({
          ...crew,
        });
        setCronEnabled(checked);

        toast({
          title: "Success",
          description: `Autonomous running ${
            checked ? "enabled" : "disabled"
          }.`,
        });
      }
    } catch (error) {
      console.error("Error toggling autonomous mode:", error);
      toast({
        title: "Error",
        description:
          "Failed to update autonomous running status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCrew = async () => {
    if (!crew) return;
    setIsDeleting(true);
    try {
      // Delete in order of dependencies
      await supabase.from("jobs").delete().eq("crew_id", crew.id);
      await supabase.from("tasks").delete().eq("crew_id", crew.id);
      await supabase.from("agents").delete().eq("crew_id", crew.id);
      if (cronId) {
        await supabase.from("crons").delete().eq("id", cronId);
      }
      const { error } = await supabase.from("crews").delete().eq("id", crew.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Crew deleted successfully",
      });

      router.push("/crews");
    } catch (error) {
      console.error("Error deleting crew:", error);
      toast({
        title: "Error",
        description: "Failed to delete crew. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!crew) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Crew Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-[200px]">
                    <label className="text-sm font-medium">Public</label>
                  </div>
                  <Switch
                    checked={editForm.is_public}
                    onCheckedChange={(checked) =>
                      setEditForm((prev) => ({ ...prev, is_public: checked }))
                    }
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-[200px] flex items-center gap-2">
                    <label className="text-sm font-medium">Cron</label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <HelpCircle className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p className="font-medium mb-2">Cron Job</p>
                          <p className="text-sm">
                            Enable to run this crew automatically on an hourly
                            schedule.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={cronEnabled}
                    onCheckedChange={handleToggleAutonomous}
                  />
                </div>
              </div>
              {cronEnabled && (
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-1">
                    Cron Input Prompt
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cronInput}
                      onChange={(e) => setCronInput(e.target.value)}
                      placeholder="execute the job"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <HelpCircle className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4">
                          <p className="font-medium mb-2">Example Prompt</p>
                          <p className="text-sm">
                            Check Bitcoin price and if its above $40,000,
                            analyze market sentiment from the last hour and
                            provide a summary of bullish/bearish indicators
                          </p>
                          <p className="text-xs mt-2 text-muted-foreground">
                            Note: This job will run every hour. The schedule is
                            fixed and cannot be modified.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
              <div className="pt-4 flex justify-start gap-2">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete Crew"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the crew and all its associated data including
                        agents, tasks, and jobs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteCrew}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AgentManagement
            crewId={crew.id}
            onAgentAdded={() => {
              fetchAgents();
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <TaskManagement
            tasks={tasks}
            agents={agents}
            crewId={crew.id}
            onTaskAdded={() => {
              fetchTasks();
            }}
            onEditTask={() => {}}
            currentUser={currentUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}
