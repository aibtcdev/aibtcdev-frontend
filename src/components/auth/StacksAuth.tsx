"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function StacksAuth() {
  const [mounted, setMounted] = useState(false);
  const { connectWallet, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuth = async () => {
    const { success } = await connectWallet();

    if (success) {
      router.push("/chat");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAuth}
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>
    </div>
  );
}
