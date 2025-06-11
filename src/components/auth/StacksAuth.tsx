"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/reusables/Loader";
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
import {
  connectWallet,
  requestSignature,
} from "@/components/auth/StacksProvider";
import { createDaoAgent } from "@/helpers/dao-agent";
import { useRouter } from "next/navigation";
import { runAutoInit } from "@/helpers/run-auto-init";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

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
        description: "connection succesfull...",
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
        // 1️⃣ get the signed-in supabase user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id;

        // 2️⃣ grab both addresses from the wallet session
        const mainnetAddr = userData.profile.stxAddress.mainnet;
        const testnetAddr = userData.profile.stxAddress.testnet;

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

  if (!mounted) return null;

  return (
    <StacksProvider>
      <Button onClick={handleAuth} disabled={isLoading} variant="primary">
        {isLoading ? (
          <>
            <Loader />
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
              AIBTC Disclosures
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4" type="always">
            <div className="prose dark:prose-invert max-w-none space-y-8">
              <section>
                <p className="text-zinc-800 dark:text-zinc-200">
                  By using the AIBTC application (the &quot;App), you agree and
                  acknowledge the following:
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  AIBTC does not control funds or DAOs
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  AIBTC provides software to assist users more easily interact
                  with blockchain networks. We do not hold user funds, issue
                  tokens, or exercise ongoing control or governance over any DAO
                  treasury.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users control all Token and DAO activities
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Users initiate and execute all tokens, purchase seats, and
                  launch DAOs. AIBTC does not manage or originate such
                  activities.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users are responsible for their own funds and DAO members for
                  DAO treasuries
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Users are responsible for their own secret keys and control of
                  your own funds. DAO treasury funds are controlled via the
                  governance mechanism of the specific DAO.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users are using their own funds
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  By using the App, you represent that any funds deployed or
                  tokens purchased are done so using your own funds.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users are responsible for the activities of their AI agents
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Users are responsible for all of the action taken by user
                  driven script executions or AI agents. AIBTC is not
                  responsible, nor can it control, the activities of user driven
                  scripts and AI agents.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users and DAO members are responsible for their own legal
                  setup and compliance
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  AIBTC does not make any sort of representation towards the
                  legal status or legal compliance of any DAO launched on the
                  App. DAO deployers and DAO members are responsible for
                  coordinating their own legal setup and compliance with various
                  laws, including taking actions to shield DAO members from
                  liability that stems from any DAO&apos;s activities.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users and DAO members should consult their own advisors
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Any documents, examples, or demos provided by AIBTC only serve
                  illustrative purposes and should not be construed as
                  financial, legal, or tax advice. Users and DAO members are
                  responsible for obtaining their own financial, legal, and tax
                  advisors.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users must comply with applicable laws
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  By using the App, users agree to comply with all applicable
                  laws and regulations applicable to their use of the App,
                  including the activities that DAO members vote for. AIBTC does
                  not guarantee or determine that any DAO activity proposed on
                  its platform complies with applicable laws.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users are not sanctioned parties
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You are not a resident, national, or agent of Iran, North
                  Korea, Syria, Cuba, and the Crimea, Donetsk People&apos;s
                  Republic and Luhansk People&apos;s Republic regions of Ukraine
                  or any other country to which the United States or any other
                  country to which the United States, the United Kingdom or the
                  European Union embargoes goods or imposes similar sanctions
                  (&quot;Restricted Territories&quot;). You have not been
                  identified as a Specially Designated National or placed on any
                  sanctions lists by the U.S. Treasury Department&apos;s Office
                  of Foreign Assets Control, the U.S. Commerce Department, or
                  the U.S. Department of State (&quot;Sanctions Lists
                  Persons&quot;); and you will not use our App to conduct any
                  illegal or illicit activity. You do not intend to and will not
                  transact with any person in a Restricted Territory or a
                  Sanctions List Person (such transaction, a &quot;Sanctioned
                  Transaction&quot;).
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  You will not use a VPN to circumvent restrictions
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You do not, and will not, use VPN software or any other
                  privacy or anonymization tools or techniques to circumvent, or
                  attempt to circumvent, any restrictions that apply to the App.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  You will not engage in Prohibited Activities
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  The use of the App to launder funds, violate third party
                  rights, such as intellectual property infringement, defraud
                  others, or engage in Sanctioned Transactions is strictly
                  prohibited (&quot;Prohibited Activities&quot;). By using the
                  App, you agree that you will not use the App to engage in any
                  Prohibited Activities.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Blockchain technology is new and may be untested
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You understand the inherent risks associated with
                  cryptographic systems, blockchain-based networks, and digital
                  assets, including but not limited to the usage and intricacies
                  of native digital assets, like bitcoin; smart contract-based
                  tokens, such as those that follow the Stacks Token Standard;
                  the risk of hardware, software, and Internet connection and
                  service issues; the risk of malicious software introduction;
                  and the risk that third parties may obtain unauthorized access
                  to information stored within your digital wallet. AIBTC does
                  not own or control any of the underlying software through
                  which blockchain networks are formed. In general, the software
                  underlying blockchain networks, including the Bitcoin and
                  Stacks blockchains, are open source, such that anyone can use,
                  copy, modify, and distribute it.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Blockchain transactions are final and irreversible
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You bear sole responsibility for evaluating transactions
                  before you execute them, and all transactions on blockchains
                  are irreversible, final, and without refunds; the App may be
                  disabled, disrupted, or adversely impacted as a result of
                  sophisticated cyber-attacks, surges in activity, computer
                  viruses, and/or other operational or technical challenges,
                  among other things; We disclaim any ongoing obligation to
                  notify you of all the potential risks of using and accessing
                  the App; You agree to accept these risks and agree that you
                  will not seek to hold us responsible for any consequent
                  losses.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  We cannot recover funds or engage in DAO governance if a user
                  loses their secret keys
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  You alone are responsible for securing any of your private
                  key(s) when you interact with funds using self-custodial
                  wallet software. We do not have access to your private key(s)
                  for self-custodial wallet software. Losing control of your
                  private key(s) will permanently and irreversibly deny you
                  access to digital assets on blockchain-based networks and the
                  ability to engage in any DAO&apos;s governance based on tokens
                  controlled by such keys. Neither AIBTC nor any other person or
                  entity will be able to retrieve or protect your digital assets
                  stored with the assistance of self-custodial wallet software.
                  If your private key(s) are lost, then you will not be able to
                  transfer your digital assets to any other blockchain address
                  or wallet. If this occurs, then you will not be able to
                  realize any value or utility from the digital assets that you
                  may hold.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Crypto markets are volatile, tokens may speculative assets and
                  you may lose the entire value of your tokens
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Crypto markets tend to experience heavy price volatility and
                  the value of any tokens acquired through the use of the App
                  may be a speculative asset and drop considerably. AIBTC makes
                  no guarantee or determination concerning the value of any
                  token and you may lose the entire value of your tokens.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  AIBTC makes no promises to the value of any token
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  We have no control over, or liability for, the delivery,
                  quality, safety, legality, or any other aspect of any digital
                  assets that you may transfer to or from a third party, and we
                  are not responsible for ensuring that an entity with whom you
                  transact completes the transaction or is authorized to do so,
                  and if you experience a problem with any transactions in
                  digital assets using the App, then you bear the entire risk.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  AI Compute Services
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  AIBTC may, at its sole discretion, provide AI compute services
                  through the App. Access is subject to usage caps, throttling,
                  or discontinuation at any time without notice. All fees for AI
                  compute are collected at proposal creation and automatically
                  transferred to the aibtc-dao-run-cost smart contract. AIBTC
                  makes no warranties about availability or performance of AI
                  compute and is not liable for indirect, incidental, or
                  consequential damages arising from its restriction or
                  termination.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Bridging activities are carried out by third party service
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  All bridging activities accessible via the App is carried out
                  by a third party service provider. AIBTC does not manage or
                  control any of the bridging activities accessible via the App.
                  AIBTC is not responsible for any disruption of service or loss
                  of funds that may occur due to such bridging service. We
                  suggest that You evaluate our third party service providers to
                  evaluate the risks in engaging in any bridging activity.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  AIBTC is not responsible for indirect, incidental or
                  consequential damages
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Under no circumstances shall AIBTC be liable for indirect,
                  incidental, or consequential damages, including lost profits,
                  even if advised of such possibilities.
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

export function getStacksAddress(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const blockstackSession = JSON.parse(
    localStorage.getItem("blockstack-session") || "{}"
  );

  const address =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
      ? blockstackSession.userData?.profile?.stxAddress?.mainnet
      : blockstackSession.userData?.profile?.stxAddress?.testnet;

  return address || null;
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
