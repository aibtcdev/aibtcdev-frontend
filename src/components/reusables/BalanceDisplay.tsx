"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber } from "@/utils/format";

interface BalanceDisplayProps {
  value: string | number;
  symbol?: string;
  decimals?: number;
  variant?: "raw" | "rounded" | "abbreviated";
  className?: string;
  showSymbol?: boolean;
}

/**
 * A reusable component for displaying cryptocurrency balances with consistent formatting
 */
export function BalanceDisplay({
  value,
  symbol = "",
  decimals = 6,
  variant = "raw",
  className = "",
  showSymbol = true,
}: BalanceDisplayProps) {
  // Convert value to number and handle potential errors
  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;
  const divisor = Math.pow(10, decimals);
  const displayValue = numericValue / divisor;

  if (isNaN(displayValue)) {
    return (
      <span className={className}>
        0{showSymbol && symbol ? ` ${symbol}` : ""}
      </span>
    );
  }

  // Format the full value with all decimals (used for raw display and tooltips)
  const fullFormattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const fullDisplay = `${fullFormattedValue}${showSymbol && symbol ? ` ${symbol}` : ""}`;

  // For raw variant, just return the full formatted value
  if (variant === "raw") {
    return <span className={`font-mono ${className}`}>{fullDisplay}</span>;
  }

  // For rounded variant, show fewer decimal places
  if (variant === "rounded") {
    const roundedValue = displayValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`font-mono ${className}`}>
              {roundedValue}
              {showSymbol && symbol ? ` ${symbol}` : ""}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{fullDisplay}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // For abbreviated variant, use K, M, B suffixes
  if (variant === "abbreviated") {
    const abbreviatedValue = formatNumber(displayValue);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`font-mono ${className}`}>
              {abbreviatedValue}
              {showSymbol && symbol ? ` ${symbol}` : ""}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{fullDisplay}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback
  return <span className={`font-mono ${className}`}>{fullDisplay}</span>;
}

/**
 * Specialized component for displaying STX balances
 */
export function StxBalance({
  value,
  variant = "raw",
  className = "",
  showSymbol = true,
}: Omit<BalanceDisplayProps, "symbol" | "decimals">) {
  return (
    <BalanceDisplay
      value={value}
      symbol="STX"
      decimals={6}
      variant={variant}
      className={className}
      showSymbol={showSymbol}
    />
  );
}

/**
 * Specialized component for displaying BTC balances
 */
export function BtcBalance({
  value,
  variant = "raw",
  className = "",
  showSymbol = true,
}: Omit<BalanceDisplayProps, "symbol" | "decimals">) {
  return (
    <BalanceDisplay
      value={value}
      symbol="BTC"
      decimals={8}
      variant={variant}
      className={`${
        variant === "raw" ? "text-primary font-semibold" : ""
      } ${className}`}
      showSymbol={showSymbol}
    />
  );
}

/**
 * Specialized component for displaying token balances
 */
export function TokenBalance({
  value,
  symbol,
  decimals = 8,
  variant = "raw",
  className = "",
  showSymbol = true,
}: BalanceDisplayProps) {
  return (
    <BalanceDisplay
      value={value}
      symbol={symbol}
      decimals={decimals}
      variant={variant}
      className={className}
      showSymbol={showSymbol}
    />
  );
}
