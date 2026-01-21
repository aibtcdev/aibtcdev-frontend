"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { requestFeedAgent } from "@/services/bitcoin-agents.service";
import type { FoodTier } from "@/types";

interface FeedButtonProps {
  agentId: number;
  agentName: string;
  foodTiers: Record<number, FoodTier>;
  disabled?: boolean;
  onFeedRequested?: (paymentDetails: {
    cost_sats: number;
    payment_address: string;
  }) => void;
}

export function FeedButton({
  agentId,
  agentName,
  foodTiers,
  disabled = false,
  onFeedRequested,
}: FeedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    cost_sats: number;
    payment_address: string;
    message: string;
  } | null>(null);

  const handleFeed = async (tier: number) => {
    setSelectedTier(tier);
    setIsLoading(true);

    try {
      const result = await requestFeedAgent(agentId, tier);
      setPaymentInfo({
        cost_sats: result.cost_sats,
        payment_address: result.payment_address,
        message: result.message,
      });
      onFeedRequested?.({
        cost_sats: result.cost_sats,
        payment_address: result.payment_address,
      });
    } catch (error) {
      console.error("Failed to request feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tiers = Object.entries(foodTiers).map(([key, value]) => ({
    ...value,
    tier: parseInt(key),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={disabled}
        >
          🍖 Feed {agentName}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feed {agentName}</DialogTitle>
          <DialogDescription>
            Choose a food tier. Higher tiers give more XP!
          </DialogDescription>
        </DialogHeader>

        {!paymentInfo ? (
          <div className="grid gap-3">
            {tiers.map((tier) => (
              <Button
                key={tier.tier}
                variant="outline"
                className="h-auto py-4 justify-between"
                onClick={() => handleFeed(tier.tier)}
                disabled={isLoading && selectedTier === tier.tier}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {tier.tier === 1 ? "🍞" : tier.tier === 2 ? "🥩" : "🍱"}
                  </span>
                  <div className="text-left">
                    <p className="font-semibold">{tier.name} Food</p>
                    <p className="text-xs text-muted-foreground">
                      +{tier.xp} XP
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{tier.cost} sats</Badge>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Send payment to:
              </p>
              <code className="text-xs break-all block bg-background p-2 rounded">
                {paymentInfo.payment_address}
              </code>
              <p className="text-2xl font-bold mt-3">
                {paymentInfo.cost_sats.toLocaleString()} sats
              </p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {paymentInfo.message}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPaymentInfo(null);
                setSelectedTier(null);
              }}
            >
              Choose Different Food
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
