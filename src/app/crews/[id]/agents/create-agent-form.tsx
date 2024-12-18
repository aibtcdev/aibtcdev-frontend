"use client";

import { useTransition } from "react";
import { createAgent } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

const initialState = {
  error: null,
  success: false,
};

export function CreateAgentForm({ crewId }: { crewId: number }) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(createAgent, initialState);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
        .then((result) => {
          if (result.success) {
            toast.success("Agent created successfully");
            // Clear form - you might want to use a form ref or state for this
          } else {
            toast.error(result.error || "Failed to create agent");
          }
        })
        .catch(() => {
          toast.error("An unexpected error occurred");
        });
    });
  };

  return (
    <form action={handleSubmit} className="mb-6 space-y-4">
      <h3 className="text-lg font-semibold">Create New Agent</h3>

      <input type="hidden" name="crew_id" value={crewId} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="agent_name">Agent Name *</Label>
          <Input
            id="agent_name"
            name="agent_name"
            placeholder="Enter agent name"
            required
          />
        </div>

        <div>
          <Label htmlFor="agent_role">Agent Role</Label>
          <Input
            id="agent_role"
            name="agent_role"
            placeholder="Enter agent role"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="agent_goal">Agent Goal</Label>
          <Input
            id="agent_goal"
            name="agent_goal"
            placeholder="Enter agent goal"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="agent_backstory">Agent Backstory</Label>
          <Textarea
            id="agent_backstory"
            name="agent_backstory"
            placeholder="Enter agent backstory"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        {isPending ? "Creating..." : "Create Agent"}
      </Button>

      {state.error && (
        <p className="text-red-500 text-sm mt-2">{state.error}</p>
      )}
    </form>
  );
}
