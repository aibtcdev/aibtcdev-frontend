"use client";

import { useState, useEffect } from "react";
import { useWalletStore, WalletBalance } from "@/store/wallet";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { fetchDAOsWithExtension } from "@/services/dao.service";
import { getStacksAddress } from "@/lib/address";
import { AccountCard } from "@/components/account/AccountCard";
import { TokenDepositModal } from "@/components/account/TokenDepositModal";
import { TokenWithdrawModal } from "@/components/account/TokenWithdrawModal";
import { AgentTokensTable } from "@/components/account/AgentTokensTable";
import { ConnectedWallet } from "@/components/account/ConnectedWallet";
import { Bot, Building2 } from "lucide-react";

function formatBalance(value: string | number, type: "stx" | "btc" | "token") {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  if (type === "stx") {
    num = num / 1e6;
  } else if (type === "btc" || type === "token") {
    num = num / 1e8;
  }

  let decimals = 6;
  if (type === "btc" || type === "token") {
    decimals = 8;
  }

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    // Trim decimals properly for < 1
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
}

interface ProfileTabProps {
  userAgentWalletAddress: string | null;
  userAgentAddress: string | null;
  userAgentContractBalance: WalletBalance | null;
  fetchWallets?: () => Promise<void>;
}

export function ProfileTab({
  userAgentWalletAddress: propUserAgentWalletAddress,
  userAgentAddress,
  fetchWallets,
}: ProfileTabProps) {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [selectedTokenForDeposit, setSelectedTokenForDeposit] = useState<{
    tokenId: string;
    tokenSymbol: string;
    daoName: string;
    contractPrincipal: string;
    balance: string;
    decimals: number;
  } | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositRecipient, setDepositRecipient] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<"agent" | "wallet" | null>(
    null
  );
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedTokenForWithdraw, setSelectedTokenForWithdraw] = useState<{
    tokenId: string;
    tokenSymbol: string;
    daoName: string;
    contractPrincipal: string;
    balance: string;
    decimals: number;
  } | null>(null);
  const { agentWallets, balances, fetchSingleBalance, fetchContractBalance } =
    useWalletStore();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const userAgentId = userAgent?.id || "";

  const { data: daos = [] } = useQuery({
    queryKey: ["daosWithExtensions"],
    queryFn: fetchDAOsWithExtension,
  });

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  const getAgentWalletInfo = (agentId: string) => {
    if (!agentId) return { walletAddress: null, walletBalance: null };

    const agentWallet = agentWallets.find(
      (wallet) => wallet.agent_id === agentId
    );
    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
    const walletAddress =
      network === "mainnet"
        ? agentWallet?.mainnet_address
        : agentWallet?.testnet_address;
    const walletBalance = walletAddress ? balances[walletAddress] : null;

    return { walletAddress: walletAddress ?? null, walletBalance };
  };

  const {
    walletAddress: userAgentWalletAddress,
    walletBalance: agentWalletBalance,
  } = getAgentWalletInfo(userAgentId);

  // Use prop value if available, otherwise use computed value
  const finalUserAgentWalletAddress =
    propUserAgentWalletAddress || userAgentWalletAddress;

  useEffect(() => {
    if (stacksAddress) {
      fetchSingleBalance(stacksAddress);
    }
    if (userAgentAddress) {
      fetchContractBalance(userAgentAddress);
    }
    if (finalUserAgentWalletAddress) {
      fetchSingleBalance(finalUserAgentWalletAddress);
    }
  }, [
    stacksAddress,
    userAgentAddress,
    finalUserAgentWalletAddress,
    fetchSingleBalance,
    fetchContractBalance,
  ]);

  const connectedWalletBalance = stacksAddress ? balances[stacksAddress] : null;
  const agentAccountBalance = userAgentAddress
    ? balances[userAgentAddress]
    : null;

  const getAllBalances = (walletBalance: WalletBalance | null) => {
    if (!walletBalance) return undefined;

    const metadata: Record<string, string> = {};

    // Add STX balance
    if (walletBalance.stx?.balance) {
      metadata["STX"] =
        formatBalance(walletBalance.stx.balance, "stx") + " STX";
    }

    // Add all fungible tokens
    if (walletBalance.fungible_tokens) {
      Object.entries(walletBalance.fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const isBtc = tokenId.includes("sbtc-token");
          const displaySymbol = isBtc ? "sBTC" : tokenSymbol || "Token";
          const balance = token.balance;

          if (balance && parseFloat(balance) > 0) {
            if (isBtc) {
              metadata[`${displaySymbol} `] =
                `${formatBalance(balance, "btc")} ${displaySymbol}`;
            } else {
              metadata[`${displaySymbol} `] =
                `${formatBalance(balance, "token")} ${displaySymbol}`;
            }
          }
        }
      );
    }

    // Add NFTs
    if (walletBalance.non_fungible_tokens) {
      Object.entries(walletBalance.non_fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const displaySymbol = tokenSymbol || "NFT";
          const count = token.count;

          if (count > 0) {
            metadata[`${displaySymbol} NFTs`] = `${count} ${displaySymbol}`;
          }
        }
      );
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        {/* Connected Wallet Section */}
        <div className="mb-6">
          <ConnectedWallet fetchWallets={fetchWallets} />
        </div>

        {/* Agent Voting Account Section */}
        {userAgentAddress ? (
          <div className="mb-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Agent Voting Account</h3>
            <AccountCard
              title="Agent Account"
              address={userAgentAddress}
              icon={Building2}
              isPrimary={false}
              network={
                userAgentAddress?.startsWith("SP") ? "mainnet" : "testnet"
              }
              helpText="Where your agent holds AI DAO tokens to power voting"
            />

            {/* DAO Tokens Management Table */}
            <div className="mt-6">
              <AgentTokensTable
                daos={daos}
                agentAddress={userAgentAddress}
                agentAccountBalance={agentAccountBalance}
                connectedWalletBalance={connectedWalletBalance}
                userAgentWalletAddress={finalUserAgentWalletAddress}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Agent Voting Account</h3>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Your agent account is under deployment. Please come back in a
                few minutes.
              </p>
            </div>
          </div>
        )}

        {/* Agent Wallet Section */}
        {finalUserAgentWalletAddress && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Agent Gas Wallet</h3>
            <AccountCard
              title="Agent Wallet"
              address={finalUserAgentWalletAddress}
              icon={Bot}
              isPrimary={false}
              network={
                finalUserAgentWalletAddress?.startsWith("SP")
                  ? "mainnet"
                  : "testnet"
              }
              helpText="Where your agent stores STX to cover gas fees for voting"
              metadata={getAllBalances(agentWalletBalance)}
            />
          </div>
        )}

        {/* Token Deposit Modal */}
        {depositRecipient && depositType && selectedTokenForDeposit && (
          <TokenDepositModal
            isOpen={depositModalOpen}
            onClose={() => {
              setDepositModalOpen(false);
              setSelectedTokenForDeposit(null);
              setDepositRecipient(null);
              setDepositType(null);
            }}
            recipientAddress={depositRecipient}
            recipientType={depositType}
            tokenData={selectedTokenForDeposit}
          />
        )}

        {/* Token Withdraw Modal */}
        {userAgentAddress && selectedTokenForWithdraw && (
          <TokenWithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => {
              setWithdrawModalOpen(false);
              setSelectedTokenForWithdraw(null);
            }}
            agentAddress={userAgentAddress}
            tokenData={selectedTokenForWithdraw}
          />
        )}
      </div>
    </div>
  );
}
