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
import { enableSingleDaoMode, singleDaoName } from "@/config/features";

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

  let filteredDaos = daos;
  if (enableSingleDaoMode) {
    filteredDaos = daos.filter(
      (dao) => dao.name.toUpperCase() === singleDaoName.toUpperCase()
    );
  }

  if (filteredDaos.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-sm bg-muted/20 flex items-center justify-center">
          <Bot className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">No DAO Token found</h3>
          <p className="text-sm text-muted-foreground">
            Your agent must hold DAO Token to participate in voting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-sm overflow-hidden">
      <div className="overflow-x-auto sm:overflow-visible">
        <Table className="min-w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="sm:min-w-[160px]">DAO</TableHead>
              <TableHead className="sm:min-w-[80px]">Mode</TableHead>
              <TableHead className="sm:min-w-[100px] hidden sm:table-cell">
                AI Model
              </TableHead>
              <TableHead className="lg:min-w-[200px] hidden lg:table-cell">
                Your Instruction
              </TableHead>
              <TableHead className="sm:min-w-[120px] text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDaos.map((dao) => {
              const prompt = getPromptForDao(dao.id);
              const isConfigured = !!prompt;

              return (
                <TableRow key={dao.id} className="hover:bg-muted/5">
                  <TableCell className="sm:min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm bg-primary flex-shrink-0" />
                      <span className="font-semibold truncate">{dao.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="sm:min-w-[80px]">
                    {isConfigured ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <div className="w-1.5 h-1.5 rounded-sm bg-green-600 mr-1 flex-shrink-0" />
                        <span>Custom</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-xs"
                      >
                        <div className="w-1.5 h-1.5 rounded-sm bg-muted-foreground mr-1 flex-shrink-0" />
                        <span>Default</span>
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="sm:min-w-[100px] hidden sm:table-cell">
                    {isConfigured ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-sm bg-primary flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {prompt.model}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  <TableCell className="lg:min-w-[200px] hidden lg:table-cell">
                    {isConfigured ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {prompt.prompt_text}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                        <Settings className="h-3 w-3 flex-shrink-0" />
                        Not configured
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="sm:min-w-[120px] text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfigure(dao.id)}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="hidden sm:inline">
                          {isConfigured ? "Edit" : "Configure"}
                        </span>
                        <span className="sm:hidden">
                          {isConfigured ? "Edit" : "Setup"}
                        </span>
                      </Button>

                      {isConfigured && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(prompt.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 flex-shrink-0" />
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
    </div>
  );
}
