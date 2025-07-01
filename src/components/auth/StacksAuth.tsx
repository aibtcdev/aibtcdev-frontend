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
} from "@/components/ui/dialog";
import { TermsOfService } from "@/components/terms-and-condition/TermsOfService";
import dynamic from "next/dynamic";
import {
  connectWallet,
  requestSignature,
} from "@/components/auth/StacksProvider";
import { createDaoAgent } from "@/services/dao-agent.service";
import { useRouter } from "next/navigation";
import { runAutoInit } from "@/lib/auto-init";
import { getLocalStorage } from "@stacks/connect";

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

      setUserData(data);
      setShowTerms(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!userData || !hasScrolledToBottom) return;

    setIsLoading(true);
    setShowTerms(false);

    try {
      console.log("userData", userData);
      // Extract STX address from the new data structure
      // Support both addressType and symbol-based structures
      const stxAddressObj = userData.addresses?.find(
        (addr: WalletAddress) =>
          addr.addressType === "stacks" || addr.symbol === "STX"
      );
      const stxAddress = stxAddressObj?.address;

      if (!stxAddress) {
        throw new Error("No STX address found in wallet data");
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

        // 2️⃣ grab addresses from the new wallet session structure
        // For now, we'll use the same address for both mainnet and testnet
        // since the new API only returns current network's address
        const currentAddress = stxAddress;
        const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
        const mainnetAddr = isMainnet ? currentAddress : "";
        const testnetAddr = !isMainnet ? currentAddress : "";

        // 3️⃣ patch the profile table (creates row if missing)
        if (userId) {
          console.log(
            "Updating profile with Stacks addresses after authentication"
          );
          await ensureProfileHasStacksAddresses(
            userId,
            mainnetAddr,
            testnetAddr
          );
          await runAutoInit(userId); // your existing auto-init
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
        className="flex items-center gap-1 px-2 py-1 sm:px-6 sm:py-3 text-xs sm:text-base font-inter font-bold text-primary-foreground bg-primary rounded-lg sm:rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 ease-in-out motion-reduce:transition-none"
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
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[900px] h-[90vh] p-0 overflow-hidden">
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
      </Dialog>
    </StacksProvider>
  );
}

export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = getLocalStorage();
    console.log(data);
    // Check if data has the new structure or old structure
    if (data?.addresses && Array.isArray(data.addresses)) {
      // New structure: array of address objects
      // Support both addressType and symbol-based structures
      const stxAddressObj = data.addresses.find(
        (addr: WalletAddress) =>
          addr.addressType === "stacks" || addr.symbol === "STX"
      );
      return stxAddressObj?.address || null;
    } else if (data?.addresses?.stx) {
      // Old structure: addresses.stx array
      const stxAddresses = data.addresses.stx;
      return stxAddresses.length > 0 ? stxAddresses[0].address : null;
    }
    return null;
  } catch (error) {
    console.error("Error getting Stacks address from local storage:", error);
    return null;
  }
}

async function ensureProfileHasStacksAddresses(
  userId: string,
  mainnetAddr: string,
  testnetAddr: string
) {
  try {
    // Get the current profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("mainnet_address, testnet_address")
      .eq("id", userId)
      .single();

    // Prepare updates object - only update fields that are null
    const updates: Record<string, string> = { id: userId };
    // If no profile exists or mainnet_address is null, add it to updates
    if (!profile?.mainnet_address && mainnetAddr) {
      updates.mainnet_address = mainnetAddr;
    }

    // If no profile exists or testnet_address is null, add it to updates
    if (!profile?.testnet_address && testnetAddr) {
      updates.testnet_address = testnetAddr;
    }

    // Only proceed if we have updates to make
    if (Object.keys(updates).length <= 1) {
      console.log("No address updates needed for profile");
      return;
    }

    // Use upsert to create or update the profile
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

    console.log("Profile updated with Stacks addresses");
  } catch (error) {
    console.error("Error in ensureProfileHasStacksAddresses:", error);
  }
}
