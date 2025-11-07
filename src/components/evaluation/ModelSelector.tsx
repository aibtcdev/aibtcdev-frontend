"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain } from "lucide-react";
import { AI_MODELS } from "@/lib/constant";

// Group models by provider for better organization
const groupedModels = { Default: AI_MODELS };

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ModelSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: ModelSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center gap-1 text-muted-foreground"
        title="AI Model"
      >
        <Brain className="h-4 w-4" />
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="model-selector"
          className="h-9 px-3 text-sm bg-background/50 border-border/50 rounded-sm hover:border-border focus:ring-1 focus:ring-primary/50 transition-all duration-200"
          title="Choose AI model for evaluation"
        >
          <SelectValue placeholder="Select model..." />
        </SelectTrigger>
        <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-sm max-h-[300px] overflow-y-auto">
          {Object.entries(groupedModels).map(([provider, models]) => (
            <div key={provider}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/20 rounded-sm mx-1 mt-1 mb-2">
                {provider}
              </div>
              {models.map((model) => (
                <SelectItem
                  key={model.value}
                  value={model.value}
                  className="text-foreground hover:bg-primary/10 rounded-sm cursor-pointer focus:bg-primary/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-sm bg-primary/60" />
                    <span className="font-medium">{model.label}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
