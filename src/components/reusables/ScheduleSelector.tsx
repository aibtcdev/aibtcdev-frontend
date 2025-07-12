"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import cronstrue from "cronstrue";

interface ScheduleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

type FrequencyType =
  | "once"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

interface ScheduleConfig {
  frequency: FrequencyType;
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export function ScheduleSelector({ value, onChange }: ScheduleSelectorProps) {
  const [config, setConfig] = useState<ScheduleConfig>(() =>
    parseCronExpression(value)
  );
  const [customError, setCustomError] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Only update the internal config when the external value changes
  useEffect(() => {
    if (!isCustomMode) {
      setConfig(parseCronExpression(value));
    }
  }, [value, isCustomMode]);

  const updateConfig = (newConfig: Partial<ScheduleConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    // Generate and propagate the new cron expression
    const cronExpression = generateCronExpression(updatedConfig);
    onChange(cronExpression);
  };

  const handleFrequencyChange = (frequency: FrequencyType) => {
    setIsCustomMode(frequency === "custom");
    const newConfig = {
      ...config,
      frequency,
      // Reset other values based on frequency
      hour: frequency === "once" ? undefined : config.hour,
      minute: frequency === "once" ? undefined : config.minute,
      dayOfWeek: ["weekly"].includes(frequency) ? config.dayOfWeek : undefined,
      dayOfMonth: ["monthly"].includes(frequency)
        ? config.dayOfMonth
        : undefined,
    };
    updateConfig(newConfig);
  };

  const handleCustomCronChange = (customCron: string) => {
    try {
      // Validate the cron expression by attempting to parse it
      cronstrue.toString(customCron);
      setCustomError("");
      setIsCustomMode(true);
      setConfig({ ...config, frequency: "custom" });
      onChange(customCron);
    } catch (error: unknown) {
      setCustomError(
        `Invalid cron expression: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getSchedulePreview = () => {
    if (config.frequency === "custom") {
      try {
        return cronstrue.toString(value);
      } catch {
        return "Invalid cron expression";
      }
    }
    return cronstrue.toString(generateCronExpression(config));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Schedule Type</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose how often this task should run</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Select
          value={config.frequency}
          onValueChange={(value: FrequencyType) => handleFrequencyChange(value)}
        >
          <SelectTrigger className="w-full h-10 px-3">
            <SelectValue className="pl-0" placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Run Once</SelectItem>
            <SelectItem value="hourly">Every Hour</SelectItem>
            <SelectItem value="daily">Every Day</SelectItem>
            <SelectItem value="weekly">Every Week</SelectItem>
            <SelectItem value="monthly">Every Month</SelectItem>
            <SelectItem value="custom">Custom Schedule</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.frequency !== "once" &&
        config.frequency !== "hourly" &&
        config.frequency !== "custom" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Time of Day</Label>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Hour (0-23)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={config.hour ?? 0}
                  onChange={(e) =>
                    updateConfig({ hour: parseInt(e.target.value) || 0 })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Minute (0-59)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={config.minute ?? 0}
                  onChange={(e) =>
                    updateConfig({ minute: parseInt(e.target.value) || 0 })
                  }
                  className="h-10"
                />
              </div>
            </div>
          </div>
        )}

      {config.frequency === "weekly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Day of Week</Label>
          </div>
          <Select
            value={String(config.dayOfWeek ?? 0)}
            onValueChange={(value) =>
              updateConfig({ dayOfWeek: parseInt(value) })
            }
          >
            <SelectTrigger className="w-full h-10 px-3">
              <SelectValue className="pl-0" placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
              <SelectItem value="3">Wednesday</SelectItem>
              <SelectItem value="4">Thursday</SelectItem>
              <SelectItem value="5">Friday</SelectItem>
              <SelectItem value="6">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {config.frequency === "monthly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Day of Month</Label>
          </div>
          <Input
            type="number"
            min={1}
            max={31}
            value={config.dayOfMonth ?? 1}
            onChange={(e) =>
              updateConfig({ dayOfMonth: parseInt(e.target.value) || 1 })
            }
            className="h-10"
            placeholder="Enter day (1-31)"
          />
        </div>
      )}

      {config.frequency === "custom" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                Custom Cron Expression
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="space-y-2 p-4">
                    <p className="font-medium">Format:</p>
                    <p>minute hour day-of-month month day-of-week</p>
                    <p className="text-muted-foreground">
                      Example: 0 12 * * 1-5 (weekdays at noon)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Input
            value={value}
            onChange={(e) => handleCustomCronChange(e.target.value)}
            placeholder="* * * * *"
            className={`h-10 ${customError ? "border-destructive" : ""}`}
          />
          {customError && (
            <p className="text-sm text-destructive mt-2">{customError}</p>
          )}
        </div>
      )}

      <div className="pt-2">
        <Separator className="mb-4" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Schedule Preview: </span>
          {getSchedulePreview()}
        </div>
      </div>
    </div>
  );
}

function parseCronExpression(cronExpression: string): ScheduleConfig {
  if (!cronExpression) {
    return { frequency: "daily", hour: 0, minute: 0 };
  }

  const parts = cronExpression.split(" ");
  if (parts.length !== 5) {
    return { frequency: "daily", hour: 0, minute: 0 };
  }

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  // Default to custom if the expression doesn't match any predefined pattern
  let frequency: FrequencyType = "custom";
  let config: ScheduleConfig = { frequency };

  if (minute === "*" && hour === "*") {
    frequency = "hourly";
  } else if (dayOfMonth === "*" && dayOfWeek === "*") {
    frequency = "daily";
    config = {
      frequency,
      hour: parseInt(hour),
      minute: parseInt(minute),
    };
  } else if (dayOfMonth === "*" && dayOfWeek !== "*") {
    frequency = "weekly";
    config = {
      frequency,
      hour: parseInt(hour),
      minute: parseInt(minute),
      dayOfWeek: parseInt(dayOfWeek),
    };
  } else if (dayOfMonth !== "*" && dayOfWeek === "*") {
    frequency = "monthly";
    config = {
      frequency,
      hour: parseInt(hour),
      minute: parseInt(minute),
      dayOfMonth: parseInt(dayOfMonth),
    };
  }

  return config;
}

function generateCronExpression(config: ScheduleConfig): string {
  switch (config.frequency) {
    case "once":
      return "0 0 1 1 *"; // Will run once at the next occurrence
    case "hourly":
      return "0 * * * *";
    case "daily":
      return `${config.minute ?? 0} ${config.hour ?? 0} * * *`;
    case "weekly":
      return `${config.minute ?? 0} ${config.hour ?? 0} * * ${
        config.dayOfWeek ?? 0
      }`;
    case "monthly":
      return `${config.minute ?? 0} ${config.hour ?? 0} ${
        config.dayOfMonth ?? 1
      } * *`;
    case "custom":
    default:
      return "* * * * *";
  }
}
