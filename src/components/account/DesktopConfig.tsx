"use client";

import type React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil, Trash2, Settings } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import type { AgentPrompt } from "./AgentPrompt";
import type { UseMutationResult } from "@tanstack/react-query";

interface EditingData {
  id: string;
  prompt_text: string;
  model: string;
  temperature: number;
}

type CreateMutationType = UseMutationResult<
  AgentPrompt,
  Error,
  Omit<AgentPrompt, "id" | "created_at" | "updated_at">,
  unknown
>;

type UpdateMutationType = UseMutationResult<
  AgentPrompt,
  Error,
  {
    id: string;
    data: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>;
  },
  unknown
>;

type DeleteMutationType = UseMutationResult<void, Error, string, unknown>;

interface DesktopConfigTableProps {
  prompts: AgentPrompt[];
  uniqueDaoIds: string[];
  editingDaoId: string | null;
  editingData: EditingData;
  errors: Record<string, string>;
  isLoading: boolean;
  getDaoName: (daoId: string) => string;
  handleStartEditing: (daoId: string) => void;
  handleCancelEditing: () => void;
  handleSavePrompt: (daoId: string) => void;
  handleDelete: (promptId: string) => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (field: keyof EditingData, value: string) => void;
  createMutation: CreateMutationType;
  updateMutation: UpdateMutationType;
  deleteMutation: DeleteMutationType;
}

export function DesktopConfigTable({
  prompts,
  uniqueDaoIds,
  editingDaoId,
  editingData,
  errors,
  isLoading,
  getDaoName,
  handleStartEditing,
  handleCancelEditing,
  handleSavePrompt,
  handleDelete,
  handleInputChange,
  handleSelectChange,
  createMutation,
  updateMutation,
  deleteMutation,
}: DesktopConfigTableProps) {
  return (
    <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-lg border border-border/30 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/20 backdrop-blur-sm">
              <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[150px]">
                DAO
              </TableHead>
              <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[100px]">
                Status
              </TableHead>
              <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[120px]">
                AI Model
              </TableHead>
              <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[100px]">
                Creativity
              </TableHead>
              <TableHead className="text-foreground font-bold px-4 py-3 text-sm min-w-[250px]">
                Instructions
              </TableHead>
              <TableHead className="text-right text-foreground font-bold px-4 py-3 text-sm w-[100px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && uniqueDaoIds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Loader />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-foreground">
                        Loading configurations...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Initializing AI agent settings
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : uniqueDaoIds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h4 className="text-base font-semibold text-foreground">
                        No DAOs Available
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Available DAOs will appear here for AI agent
                        configuration. Connect to organizations to begin
                        automated governance.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              uniqueDaoIds.map((daoId) => {
                const prompt = prompts.find((p) => p.dao_id === daoId);
                const daoName = getDaoName(daoId);
                const isEditing = editingDaoId === daoId;

                return (
                  <TableRow
                    key={daoId}
                    className="border-border/20 hover:bg-gradient-to-r hover:from-muted/20 hover:via-muted/10 hover:to-transparent transition-all duration-300"
                  >
                    <TableCell className="font-bold text-foreground px-4 py-3 text-sm w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                        <span className="truncate">{daoName}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 w-[100px]">
                      {prompt?.is_active ? (
                        <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border-primary/40 px-2 py-1 font-semibold text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground border-muted/40 px-2 py-1 font-semibold text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </TableCell>

                    {/* Model Selection */}
                    <TableCell className="px-4 py-3 w-[120px]">
                      {isEditing ? (
                        <Select
                          value={editingData.model}
                          onValueChange={(value) =>
                            handleSelectChange("model", value)
                          }
                        >
                          <SelectTrigger className="h-8 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-lg text-sm">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-lg">
                            <SelectItem
                              value="gpt-4.1"
                              className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                                GPT-4.1
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="gpt-4o"
                              className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                GPT-4o
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="gpt-4o-mini"
                              className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                GPT-4o Mini
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="gpt-4.1-nano"
                              className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                GPT-4.1 Nano
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="gpt-4.1-mini"
                              className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                                GPT-4.1 Mini
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          <span className="text-muted-foreground font-semibold text-xs truncate">
                            {prompt?.model || "gpt-4.1"}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Temperature */}
                    <TableCell className="px-4 py-3 w-[100px]">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            name="temperature"
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={editingData.temperature}
                            onChange={handleInputChange}
                            className="h-8 w-16 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-lg text-center text-sm"
                          />
                          {errors.temperature && (
                            <p className="text-xs text-destructive font-medium">
                              {errors.temperature}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                              style={{
                                width: `${(prompt?.temperature || 0.1) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-muted-foreground font-semibold text-xs w-6 text-right">
                            {prompt?.temperature || 0.1}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Prompt Text */}
                    <TableCell className="px-4 py-3 min-w-[250px]">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Textarea
                            name="prompt_text"
                            value={editingData.prompt_text}
                            onChange={handleInputChange}
                            placeholder="Enter detailed AI agent instructions and decision-making criteria..."
                            className="min-h-[60px] max-h-[100px] text-xs bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground placeholder:text-muted-foreground/70 rounded-lg resize-none"
                          />
                          {errors.prompt_text && (
                            <p className="text-xs text-destructive font-medium">
                              {errors.prompt_text}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {prompt?.prompt_text ? (
                            <div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {prompt.prompt_text}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground/70 italic text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                              No configuration set
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right px-4 py-3 w-[100px]">
                      {isEditing ? (
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEditing}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
                            title="Cancel editing"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSavePrompt(daoId)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 rounded-lg"
                            title="Save configuration"
                          >
                            {createMutation.isPending ||
                            updateMutation.isPending ? (
                              <Loader />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditing(daoId)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
                            title="Configure agent"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {prompt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(prompt.id)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/20 hover:to-destructive/20 rounded-lg"
                              title="Delete configuration"
                            >
                              {deleteMutation.isPending ? (
                                <Loader />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
