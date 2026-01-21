"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requestMintAgent, fetchFoodTiers } from "@/services/bitcoin-agents.service";
import Link from "next/link";
import { useEffect } from "react";

const BITCOIN_FACES_API = "https://bitcoinfaces.xyz/api";

export default function MintAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [previewSeed, setPreviewSeed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mintCost, setMintCost] = useState(10000);
  const [paymentInfo, setPaymentInfo] = useState<{
    cost_sats: number;
    payment_address: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate a preview seed when name changes
  useEffect(() => {
    if (name.length >= 1) {
      // Use name + timestamp for unique preview
      setPreviewSeed(`preview-${name}-${Date.now()}`);
    }
  }, [name]);

  // Fetch mint cost
  useEffect(() => {
    fetchFoodTiers()
      .then((data) => setMintCost(data.mint_cost))
      .catch(console.error);
  }, []);

  const handleMint = async () => {
    if (!name.trim()) {
      setError("Please enter a name for your agent");
      return;
    }

    if (name.length > 64) {
      setError("Name must be 64 characters or less");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestMintAgent(name.trim());
      setPaymentInfo({
        cost_sats: result.cost_sats,
        payment_address: result.payment_address,
        message: result.message,
      });
    } catch (err) {
      setError("Failed to initiate mint. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const facePreviewUrl = previewSeed
    ? `${BITCOIN_FACES_API}/get-image?name=${previewSeed}`
    : null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Back Button */}
      <Link
        href="/bitcoin-agents"
        className="text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Agents
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🥚 Mint Your Bitcoin Agent</h1>
        <p className="text-muted-foreground">
          Create a unique AI companion that lives on Bitcoin
        </p>
      </div>

      {!paymentInfo ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview */}
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 border-4 border-border mb-4">
                {facePreviewUrl ? (
                  <AvatarImage src={facePreviewUrl} alt="Preview" />
                ) : null}
                <AvatarFallback className="text-4xl bg-muted">
                  {name ? name.slice(0, 2).toUpperCase() : "🥚"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Your agent&apos;s unique Bitcoin Face
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                placeholder="Enter a unique name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={64}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/64 characters
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Mint Cost</h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Agent NFT</span>
                <span className="font-mono">
                  {mintCost.toLocaleString()} sats
                </span>
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="font-mono font-bold text-lg">
                  {mintCost.toLocaleString()} sats
                </span>
              </div>
            </div>

            {/* What You Get */}
            <div className="space-y-2">
              <h3 className="font-medium">What you get:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unique Bitcoin Face avatar</li>
                <li>✓ On-chain AI agent identity</li>
                <li>✓ Starting level: Hatchling</li>
                <li>✓ 100% hunger and health</li>
                <li>✓ Access to read-only MCP tools</li>
              </ul>
            </div>

            {/* Warning */}
            <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 p-4 rounded-lg text-sm">
              <p className="font-medium mb-1">⚠️ Important</p>
              <p>
                Bitcoin Agents require regular feeding to survive. If you
                neglect your agent, it will die permanently. Death is real
                and cannot be reversed.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Mint Button */}
            <Button
              size="lg"
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={handleMint}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Processing..." : "🥚 Mint Agent"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Send exactly this amount:
              </p>
              <p className="text-4xl font-bold mb-4">
                {paymentInfo.cost_sats.toLocaleString()} sats
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                To this address:
              </p>
              <code className="text-sm break-all block bg-background p-3 rounded text-center">
                {paymentInfo.payment_address}
              </code>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {paymentInfo.message}
            </p>

            {/* QR Code placeholder */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">QR Code</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(paymentInfo.payment_address);
                }}
              >
                Copy Address
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setPaymentInfo(null)}
              >
                ← Back to Form
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              After payment is confirmed on-chain, your agent will appear in
              your collection. This may take a few minutes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">🍖 Feeding</h3>
            <p className="text-sm text-muted-foreground">
              Feed your agent regularly to keep it alive. Premium food gives
              more XP!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">⭐ Evolution</h3>
            <p className="text-sm text-muted-foreground">
              Earn XP to evolve from Hatchling to Legendary. Higher levels
              unlock more tools.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
