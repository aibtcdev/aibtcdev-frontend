"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { connectWallet, requestSignature } from "./stacks-provider";

// Dynamically import StacksProvider component
const StacksProvider = dynamic(() => import("./stacks-provider"), {
  ssr: false,
});

export default function StacksAuth() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

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

        toast({
          description: "Successfully signed up...",
          variant: "default",
        });

        return true;
      } else if (signInError) {
        throw signInError;
      }

      toast({
        description: "Redirecting to dashboard...",
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
    if (!userData) return;

    setIsLoading(true);
    setShowTerms(false);

    try {
      const stxAddress = userData.profile.stxAddress.mainnet;

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
        router.push("/daos");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!mounted) return null;

  return (
    <StacksProvider>
      <Button
        onClick={handleAuth}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg font-bold transition-all duration-200 border-0"
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

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              Disclaimer and Terms of Use
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4">
            <div className="prose dark:prose-invert max-w-none space-y-8">
              <section>
                <p className="text-zinc-800 dark:text-zinc-200">
                  By accessing, downloading, installing, or otherwise using this
                  product (the &quot;AIBTC.DEV&quot;), you acknowledge that you
                  have read, understood, and agree to be bound by these terms.
                  If you do not agree with these terms, you must immediately
                  cease all use of the Product.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  &quot;As-Is&quot; Provision
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  This Product is provided on an &quot;as-is&quot; and
                  &quot;as-available&quot; basis without any warranties or
                  representations of any kind, whether express, implied, or
                  statutory. To the fullest extent permitted by law, we
                  expressly disclaim any and all warranties, including but not
                  limited to implied warranties of merchantability, fitness for
                  a particular purpose, non-infringement, title, reliability,
                  security, accuracy, or availability.
                </p>
                <p className="mt-4 text-zinc-800 dark:text-zinc-200">
                  We make no representations or guarantees that:
                </p>
                <ul className="list-disc pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
                  <li>
                    The Product will meet your specific needs or expectations;
                  </li>
                  <li>
                    The Product will be uninterrupted, timely, secure, or
                    error-free;
                  </li>
                  <li>
                    The results, data, or outputs obtained through the Product
                    will be accurate, complete, reliable, or error-free;
                  </li>
                  <li>
                    Any defects or errors in the Product will be corrected.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Assumption of Risk
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You expressly acknowledge and accept that your use of the
                  Product is at your sole risk. We shall not be liable for any
                  losses or damages of any kind, including but not limited to:
                </p>
                <ul className="list-disc pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
                  <li>
                    Direct, indirect, incidental, consequential, special, or
                    punitive damages;
                  </li>
                  <li>
                    Financial losses, including but not limited to loss of
                    income, revenue, or profits;
                  </li>
                  <li>
                    Data breaches, security incidents, unauthorized access to
                    data, or loss or corruption of data;
                  </li>
                  <li>
                    Errors, inaccuracies, or omissions in the Product&apos;s
                    outputs or functionalities;
                  </li>
                  <li>
                    Any outcomes or consequences of decisions, transactions, or
                    actions taken based on the use of the Product.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  To the maximum extent permitted by applicable law, we shall
                  not be liable for any damages arising out of or related to:
                </p>
                <ol className="list-decimal pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
                  <li>The use or inability to use the Product;</li>
                  <li>
                    Any errors, bugs, vulnerabilities, or interruptions in the
                    Product;
                  </li>
                  <li>
                    Unauthorized access to your data, transactions, or
                    communications;
                  </li>
                  <li>Any failure of the Product to perform as expected;</li>
                  <li>Any reliance placed on the Product or its outputs;</li>
                  <li>
                    Any losses or damages arising from the actions or inactions
                    of third parties.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You agree to indemnify, defend, and hold harmless us, our
                  affiliates, officers, directors, employees, agents, licensors,
                  and suppliers from and against any claims, liabilities,
                  damages, losses, or expenses (including reasonable legal fees
                  and costs) arising out of or in any way connected with your:
                </p>
                <ul className="list-disc pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
                  <li>Use or misuse of the Product;</li>
                  <li>Violation of these terms;</li>
                  <li>
                    Violation of any applicable laws, regulations, or
                    third-party rights;
                  </li>
                  <li>
                    Misrepresentation or reliance on the Product&apos;s outputs.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  User Responsibility
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  The Product is intended solely as a tool to assist users. You
                  are solely responsible for:
                </p>
                <ul className="list-disc pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
                  <li>
                    Conducting your own research and due diligence before making
                    any decisions, transactions, or actions based on the Product
                    or its outputs;
                  </li>
                  <li>
                    Safeguarding your data, credentials, accounts, and any
                    sensitive information;
                  </li>
                  <li>
                    Ensuring compliance with applicable laws, regulations, and
                    industry standards.
                  </li>
                </ul>
                <p className="mt-4 text-zinc-800 dark:text-zinc-200">
                  We make no recommendations, endorsements, or assurances
                  regarding the suitability of the Product for any specific use
                  case. You acknowledge and agree that any reliance on the
                  Product, its outputs, or related materials is at your own
                  discretion and risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  No Professional Advice
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  The Product is not intended to provide professional advice of
                  any kind, including but not limited to legal, financial,
                  medical, or technical advice. You are encouraged to consult
                  with appropriate professionals before relying on or acting
                  upon any information or outputs from the Product.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Termination and Updates
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  We reserve the right to modify, suspend, or discontinue the
                  Product at any time, with or without notice, and without
                  liability to you. We also reserve the right to update these
                  terms, and your continued use of the Product constitutes
                  acceptance of any such updates.
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-6">
            <Button onClick={handleAcceptTerms} size="lg">
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StacksProvider>
  );
}
