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

const OPENROUTER_MODELS = [
  // Google Models
  {
    value: "google/gemini-2.5-flash-preview-05-20",
    label: "Gemini 2.5 Flash Preview 05-20",
    provider: "Google",
  },
  {
    value: "google/gemini-2.5-pro-preview",
    label: "Gemini 2.5 Pro Preview 06-05",
    provider: "Google",
  },

  // DeepSeek Models
  {
    value: "deepseek/deepseek-chat-v3-0324",
    label: "DeepSeek V3 0324",
    provider: "DeepSeek",
  },
  {
    value: "deepseek/deepseek-r1-0528",
    label: "R1 0528",
    provider: "DeepSeek",
  },

  // OpenAI Models
  { value: "openai/gpt-4o-mini", label: "GPT-4o-mini", provider: "OpenAI" },
  { value: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI" },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI" },

  // Meta Models
  {
    value: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B Instruct",
    provider: "Meta",
  },
  {
    value: "meta-llama/llama-4-maverick",
    label: "Llama 4 Maverick",
    provider: "Meta",
  },

  // Mistral Models
  {
    value: "mistralai/mistral-nemo",
    label: "Mistral Nemo",
    provider: "Mistral AI",
  },
];

// Group models by provider for better organization
const groupedModels = OPENROUTER_MODELS.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, typeof OPENROUTER_MODELS>
);

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
          className="h-9 px-3 text-sm bg-background/50 border-border/50 rounded-md hover:border-border focus:ring-1 focus:ring-primary/50 transition-all duration-200"
          title="Choose AI model for evaluation"
        >
          <SelectValue placeholder="Select model..." />
        </SelectTrigger>
        <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-lg max-h-[300px] overflow-y-auto">
          {Object.entries(groupedModels).map(([provider, models]) => (
            <div key={provider}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/20 rounded-md mx-1 mt-1 mb-2">
                {provider}
              </div>
              {models.map((model) => (
                <SelectItem
                  key={model.value}
                  value={model.value}
                  className="text-foreground hover:bg-primary/10 rounded-md cursor-pointer focus:bg-primary/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
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
