import { useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ConnectWallet() {
  const { isAuthenticated, isLoading, initiateAuthentication } = useAuth();
  const router = useRouter();

  const handleConnect = useCallback(() => {
    initiateAuthentication();
  }, [initiateAuthentication]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold"
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  return null;
}
