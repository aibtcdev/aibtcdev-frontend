"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil, Trash2 } from "lucide-react";
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

interface MobileConfigCardProps {
  daoId: string;
  daoName: string;
  prompt?: AgentPrompt;
  isEditing: boolean;
  editingData: EditingData;
  errors: Record<string, string>;
  onStartEditing: (daoId: string) => void;
  onCancelEditing: () => void;
  onSavePrompt: (daoId: string) => void;
  onDelete: (promptId: string) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (field: keyof EditingData, value: string) => void;
  isLoading: boolean;
  createMutation: CreateMutationType;
  updateMutation: UpdateMutationType;
  deleteMutation: DeleteMutationType;
}

export function MobileConfigCard({
  daoId,
  daoName,
  prompt,
  isEditing,
  editingData,
  errors,
  onStartEditing,
  onCancelEditing,
  onSavePrompt,
  onDelete,
  onInputChange,
  onSelectChange,
  isLoading,
  createMutation,
  updateMutation,
  deleteMutation,
}: MobileConfigCardProps) {
  return (
    <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-lg border border-border/30 p-4 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
          <h4 className="font-bold text-foreground text-sm truncate">
            {daoName}
          </h4>
        </div>
        {/* Status Badge */}
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
      </div>

      {/* Configuration Content */}
      <div className="space-y-3">
        {/* AI Model */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            AI Model
          </label>
          {isEditing ? (
            <Select
              value={editingData.model}
              onValueChange={(value) => onSelectChange("model", value)}
            >
              <SelectTrigger className="h-9 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-lg text-sm">
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
            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-muted-foreground font-semibold text-sm">
                {prompt?.model || "gpt-4.1"}
              </span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Instructions
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                name="prompt_text"
                value={editingData.prompt_text}
                onChange={onInputChange}
                placeholder="Enter detailed AI agent instructions and decision-making criteria..."
                className="min-h-[80px] max-h-[120px] text-xs bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground placeholder:text-muted-foreground/70 rounded-lg resize-none"
              />
              {errors.prompt_text && (
                <p className="text-xs text-destructive font-medium">
                  {errors.prompt_text}
                </p>
              )}
            </div>
          ) : (
            <div className="p-2 bg-muted/20 rounded-lg border border-border/20 min-h-[60px]">
              {prompt?.prompt_text ? (
                <p className="text-xs text-muted-foreground">
                  {prompt.prompt_text}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/70 italic text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  No configuration set
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-2 pt-2 border-t border-border/20">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEditing}
              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSavePrompt(daoId)}
              disabled={isLoading}
              className="h-8 px-3 text-primary hover:text-primary hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 rounded-lg"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="flex items-center gap-1">
                  <Loader />
                  Saving...
                </div>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartEditing(daoId)}
              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Configure
            </Button>
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(prompt.id)}
                disabled={deleteMutation.isPending}
                className="h-8 px-3 text-destructive hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/20 hover:to-destructive/20 rounded-lg"
              >
                {deleteMutation.isPending ? (
                  <div className="flex items-center gap-1">
                    <Loader />
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
