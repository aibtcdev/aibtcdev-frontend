"use client";

import { useTransition } from "react";
import { deleteAgent } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteAgentButton({
  agentId,
  crewId,
}: {
  agentId: number;
  crewId: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this agent?")) {
      startTransition(() => {
        deleteAgent(agentId, crewId)
          .then((result) => {
            if (result.success) {
              toast.success("Agent deleted successfully");
            } else {
              toast.error(result.error || "Failed to delete agent");
            }
          })
          .catch(() => {
            toast.error("An unexpected error occurred");
          });
      });
    }
  };

  return (
    <Button
      variant="destructive"
      size="icon"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
