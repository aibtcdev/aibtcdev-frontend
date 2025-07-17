"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Pencil, Trash2, Bot } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAgentPrompt } from "@/services/agent-prompt.service";
import { useToast } from "@/hooks/useToast";
import type { AgentPrompt } from "./AgentPromptForm";

interface AgentConfigTableProps {
  daos: Array<{ id: string; name: string }>;
  prompts: AgentPrompt[];
  onConfigure: (daoId: string) => void;
}

export function AgentConfigTable({
  daos,
  prompts,
  onConfigure,
}: AgentConfigTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAgentPrompt(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete configuration: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (promptId: string) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(promptId);
    }
  };

  const getPromptForDao = (daoId: string) => {
    return prompts.find((p) => p.dao_id === daoId);
  };

  if (daos.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
          <Bot className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">No DAOs Available</h3>
          <p className="text-sm text-muted-foreground">
            Connect to DAOs to configure your AI agent for automated governance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">DAO Organization</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px]">AI Model</TableHead>
            <TableHead className="w-[100px]">Creativity</TableHead>
            <TableHead className="min-w-[250px]">Configuration</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {daos.map((dao) => {
            const prompt = getPromptForDao(dao.id);
            const isConfigured = !!prompt;

            return (
              <TableRow key={dao.id} className="hover:bg-muted/5">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-semibold">{dao.name}</span>
                  </div>
                </TableCell>

                <TableCell>
                  {isConfigured ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1" />
                      Disabled
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  {isConfigured ? (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm font-medium">
                        {prompt.model}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {isConfigured ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${(prompt.temperature || 0) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">
                        {prompt.temperature}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {isConfigured ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                      {prompt.prompt_text}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                      <Settings className="h-3 w-3" />
                      No configuration set
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConfigure(dao.id)}
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {isConfigured ? "Edit" : "Configure"}
                    </Button>

                    {isConfigured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prompt.id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
