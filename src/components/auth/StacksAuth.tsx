"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/reusables/Loader";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { TermsOfService } from "@/components/terms-and-condition/TermsOfService";
import dynamic from "next/dynamic";
import {
  connectWallet,
  requestSignature,
} from "@/components/auth/StacksProvider";
import { createDaoAgent } from "@/services/dao-agent.service";
import { useRouter } from "next/navigation";
import { getStacksAddress } from "@/lib/address";
import { getStacksAddressPair } from "@aibtc/types";

// Define proper interface for wallet user data
interface WalletAddress {
  symbol?: string;
  address: string;
  type?: string;
  addressType?: string;
  publicKey?: string;
  tweakedPublicKey?: string;
  derivationPath?: string;
}

interface WalletUserData {
  addresses: WalletAddress[];
  profile?: {
    stxAddress?: {
      mainnet?: string;
      testnet?: string;
    };
  };
}

// Dynamically import StacksProvider component
const StacksProvider = dynamic(
  () => import("@/components/auth/StacksProvider"),
  {
    ssr: false,
  }
);

export default function StacksAuth({ redirectUrl }: { redirectUrl?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [userData, setUserData] = useState<WalletUserData | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset scroll state when terms dialog opens
  useEffect(() => {
    if (showTerms) {
      setHasScrolledToBottom(false);
    }
  }, [showTerms]);

  const handleAuthentication = async (
    stxAddress: string,
    signature: string
  ) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${stxAddress}@stacks.id`,
        password: signature,
      });

      if (signInError && signInError.status === 400) {
        toast({
          description: "Creating your account...",
        });

        const { error: signUpError } = await supabase.auth.signUp({
          email: `${stxAddress}@stacks.id`,
          password: signature,
        });

        if (signUpError) throw signUpError;

        // Initialize DAO agent only during signup
        try {
          const agent = await createDaoAgent();
          if (agent) {
            toast({
              title: "DAO Agent Initialized",
              description: "Your DAO agent has been set up successfully.",
              variant: "default",
            });
          }
        } catch (error) {
          console.error("Error initializing DAO agent:", error);
        }

        toast({
          description: "Successfully signed up...",
          variant: "default",
        });

        return true;
      } else if (signInError) {
        throw signInError;
      }

      toast({
        description: "connection succesful...",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const validateNetworkAddress = (address: string): boolean => {
    const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";

    if (isMainnet) {
      // Mainnet addresses start with SP or SM
      return address.startsWith("SP") || address.startsWith("SM");
    } else {
      // Testnet addresses start with ST
      return address.startsWith("ST");
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      toast({
        description: "Connecting wallet...",
      });

      const data = await connectWallet({
        onCancel: () => {
          toast({
            description: "Wallet connection cancelled.",
          });
          setIsLoading(false);
        },
      });

      // Validate that the connected address matches the expected network
      const stxAddress = getStacksAddress();
      if (!stxAddress) {
        throw new Error("No STX address found in wallet data");
      }

      if (!validateNetworkAddress(stxAddress)) {
        const expectedNetwork =
          process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
            ? "mainnet"
            : "testnet";
        const currentNetwork = stxAddress.startsWith("ST")
          ? "testnet"
          : "mainnet";

        toast({
          title: "Network Mismatch",
          description: `Please switch your wallet to ${expectedNetwork.toUpperCase()} network. Currently connected to ${currentNetwork.toUpperCase()}. Check your wallet settings to change networks.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setUserData(data);
      setShowTerms(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Authentication error:", error);

      // Check if it's a network mismatch error
      if (
        error instanceof Error &&
        error.message.includes("Please switch your wallet to")
      ) {
        toast({
          title: "Network Mismatch",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          description: "Authentication failed. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!userData || !hasScrolledToBottom) return;

    setIsLoading(true);
    setShowTerms(false);

    try {
      // Extract STX address using getStacksAddress helper function
      const stxAddress = getStacksAddress();
      if (!stxAddress) {
        throw new Error("No STX address found in wallet data");
      }

      // Double-check network validation before proceeding
      if (!validateNetworkAddress(stxAddress)) {
        const expectedNetwork =
          process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
            ? "mainnet"
            : "testnet";
        const currentNetwork = stxAddress.startsWith("ST")
          ? "testnet"
          : "mainnet";

        toast({
          title: "Network Mismatch",
          description: `Please switch your wallet to ${expectedNetwork.toUpperCase()} network. Currently connected to ${currentNetwork.toUpperCase()}. Go to your wallet settings and change the network.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Request signature
      toast({
        description: "Please sign the message to authenticate...",
      });

      const signature = await requestSignature();

      toast({
        description: "Signature received. Authenticating...",
      });

      const success = await handleAuthentication(stxAddress, signature);

      if (success) {
        // 1️⃣ get the signed-in supabase user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id;

        // 2️⃣ derive both testnet and mainnet addresses using getStacksAddressPair
        // This function can take either a testnet or mainnet address and return both
        // Network validation above ensures user connects with correct network for this environment
        let mainnetAddr: string;
        let testnetAddr: string;

        try {
          const addressPair = getStacksAddressPair(stxAddress);
          mainnetAddr = addressPair.mainnet;
          testnetAddr = addressPair.testnet;
        } catch (error) {
          console.error("Error with getStacksAddressPair:", error);
          // Fallback: if the function fails, use the connected address for the current network
          // and leave the other network address empty for now
          if (stxAddress.startsWith("ST")) {
            testnetAddr = stxAddress;
            mainnetAddr = ""; // Will need to be derived later
          } else {
            mainnetAddr = stxAddress;
            testnetAddr = ""; // Will need to be derived later
          }
        }

        // 3️⃣ patch the profile table (creates row if missing)
        if (userId) {
          await ensureProfileHasStacksAddresses(
            userId,
            mainnetAddr,
            testnetAddr
          );
        }

        if (redirectUrl) {
          router.push(redirectUrl);
          setIsLoading(false);
        } else {
          toast({
            description: "Authentication successful.",
            variant: "default",
          });
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleScrollComplete = (isComplete: boolean) => {
    setHasScrolledToBottom(isComplete);
  };

  if (!mounted) return null;

  return (
    <StacksProvider>
      <Button
        onClick={handleAuth}
        disabled={isLoading}
        variant="primary"
        className="flex items-center gap-1 px-2 py-1 sm:px-6 sm:py-3 text-xs sm:text-base font-inter font-bold text-primary-foreground bg-primary rounded-md sm:rounded-md hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 ease-in-out motion-reduce:transition-none"
        aria-label={isLoading ? "Connecting wallet" : "Connect wallet"}
      >
        {isLoading ? (
          <>
            <Loader />
            <span className="font-inter font-medium tracking-wide">
              Connecting...
            </span>
          </>
        ) : (
          <span className="font-inter font-bold tracking-wide">
            Connect Wallet
          </span>
        )}
      </Button>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogPortal>
          <DialogOverlay className="z-[110]" />
          <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[900px] h-[90vh] p-0 overflow-hidden z-[110]">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Terms & Conditions
              </DialogTitle>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Please read the complete terms and scroll to the bottom to
                continue.
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <TermsOfService onScrollComplete={handleScrollComplete} />
            </div>

            <DialogFooter className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setShowTerms(false)}
                  variant="outline"
                  className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAcceptTerms}
                  disabled={isLoading || !hasScrolledToBottom}
                  className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                    hasScrolledToBottom
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                  title={
                    !hasScrolledToBottom
                      ? "Please scroll to the bottom to read all terms"
                      : ""
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    <>
                      {hasScrolledToBottom
                        ? "Accept & Continue"
                        : "Please scroll to continue"}
                    </>
                  )}
                </Button>
              </div>
              {!hasScrolledToBottom && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  You must read all terms before accepting
                </p>
              )}
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </StacksProvider>
  );
}

async function ensureProfileHasStacksAddresses(
  userId: string,
  mainnetAddr: string,
  testnetAddr: string
) {
  try {
    // Always store both addresses - we derive them from the connected address
    // Note: addresses might be empty strings if derivation failed
    const updates: Record<string, string | null> = {
      id: userId,
      mainnet_address: mainnetAddr || null,
      testnet_address: testnetAddr || null,
    };

    // Use upsert to create or update the profile with both addresses
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert(updates, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (upsertErr) {
      console.error("Error updating profile:", upsertErr);
      throw upsertErr;
    }
  } catch (error) {
    console.error("Error in ensureProfileHasStacksAddresses:", error);
  }
}
