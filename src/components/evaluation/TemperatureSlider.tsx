"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Thermometer } from "lucide-react";

interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function TemperatureSlider({
  value,
  onChange,
  disabled = false,
  className = "",
  min = 0,
  max = 2,
  step = 0.1,
}: TemperatureSliderProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value);
    if (!isNaN(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value);
    if (!isNaN(inputValue) && inputValue >= min && inputValue <= max) {
      onChange(inputValue);
    }
  };

  // Get creativity level description based on temperature
  const getCreativityLevel = (temp: number) => {
    if (temp <= 0.3) return { level: "Conservative", color: "text-blue-500" };
    if (temp <= 0.7) return { level: "Balanced", color: "text-green-500" };
    if (temp <= 1.2) return { level: "Creative", color: "text-orange-500" };
    return { level: "High Creative", color: "text-red-500" };
  };

  const creativityInfo = getCreativityLevel(value);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center gap-1 text-muted-foreground"
        title="Temperature (Creativity Level)"
      >
        <Thermometer className="h-4 w-4" />
      </div>

      <div className="flex items-center gap-2 flex-1">
        <input
          id="temperature-slider"
          type="range"
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="flex-1 h-2 bg-muted/30 rounded-lg appearance-none cursor-pointer slider"
          title={`Temperature: ${value.toFixed(1)} (${creativityInfo.level})`}
        />
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="w-16 h-9 text-xs text-center bg-background/50 border-border/50 rounded-md"
          title="Temperature value"
        />
      </div>

      <div className="text-xs">
        <span className={`font-medium ${creativityInfo.color}`}>
          {creativityInfo.level}
        </span>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .slider {
          background: linear-gradient(
            to right,
            #3b82f6 0%,
            #10b981 35%,
            #f59e0b 70%,
            #ef4444 100%
          );
        }
      `}</style>
    </div>
  );
}
