"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TokenDepositModal } from "@/components/account/TokenDepositModal";
import { TokenWithdrawModal } from "@/components/account/TokenWithdrawModal";
import { WalletBalance } from "@/store/wallet";

interface TokenData {
  tokenId: string;
  tokenSymbol: string;
  daoName: string;
  contractPrincipal: string;
  balance: string;
  decimals: number;
}

interface DAOExtension {
  type: string;
  subtype: string;
  contract_principal?: string;
}

interface DAO {
  id: string;
  name: string;
  extensions?: DAOExtension[];
}

interface AgentTokensTableProps {
  daos: DAO[];
  agentAddress: string;
  agentAccountBalance: WalletBalance | null;
  connectedWalletBalance: WalletBalance | null;
  userAgentWalletAddress?: string | null;
}

function formatBalance(value: string | number, decimals: number = 8) {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  num = num / Math.pow(10, decimals);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
}

export function AgentTokensTable({
  daos,
  agentAddress,
  agentAccountBalance,
  connectedWalletBalance,
}: AgentTokensTableProps) {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [depositRecipient, setDepositRecipient] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<"agent" | "wallet" | null>(
    null
  );

  // Get all DAO tokens and their balances
  const getTokensData = () => {
    const tokensData: Array<{
      dao: DAO;
      tokenExtension: DAOExtension;
      agentBalance: string;
      userBalance: string;
      tokenData: TokenData;
    }> = [];

    daos.forEach((dao) => {
      const tokenExtension = dao.extensions?.find(
        (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
      );

      if (tokenExtension?.contract_principal) {
        // Get agent balance
        let agentBalance = "0";
        if (agentAccountBalance?.fungible_tokens) {
          const agentTokenEntry = Object.entries(
            agentAccountBalance.fungible_tokens
          ).find(([tokenId]) =>
            tokenId.startsWith(tokenExtension.contract_principal!)
          );
          agentBalance = agentTokenEntry?.[1]?.balance || "0";
        }

        // Get user balance
        let userBalance = "0";
        if (connectedWalletBalance?.fungible_tokens) {
          const userTokenEntry = Object.entries(
            connectedWalletBalance.fungible_tokens
          ).find(([tokenId]) =>
            tokenId.startsWith(tokenExtension.contract_principal!)
          );
          userBalance = userTokenEntry?.[1]?.balance || "0";
        }

        // Create token data
        const tokenId = `${tokenExtension.contract_principal}::${dao.name.toLowerCase()}`;
        const tokenData: TokenData = {
          tokenId,
          tokenSymbol: dao.name,
          daoName: dao.name,
          contractPrincipal: tokenExtension.contract_principal,
          balance: userBalance, // For deposits, we use user balance
          decimals: 8,
        };

        tokensData.push({
          dao,
          tokenExtension,
          agentBalance,
          userBalance,
          tokenData,
        });
      }
    });

    return tokensData;
  };

  const handleDeposit = (
    tokenData: TokenData,
    recipient: string,
    type: "agent" | "wallet"
  ) => {
    setSelectedToken(tokenData);
    setDepositRecipient(recipient);
    setDepositType(type);
    setDepositModalOpen(true);
  };

  const handleWithdraw = (tokenData: TokenData, agentBalance: string) => {
    // Create token data with agent balance for withdrawal
    const withdrawTokenData = {
      ...tokenData,
      balance: agentBalance,
    };
    setSelectedToken(withdrawTokenData);
    setWithdrawModalOpen(true);
  };

  const tokensData = getTokensData();

  if (tokensData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No DAO tokens found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead className="text-right"> Balance</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokensData.map(({ dao, agentBalance, userBalance, tokenData }) => {
              const hasAgentBalance = parseFloat(agentBalance) > 0;
              const hasUserBalance = parseFloat(userBalance) > 0;

              return (
                <TableRow key={dao.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {dao.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatBalance(agentBalance, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-2">
                      {/* Deposit to Agent Account */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDeposit(tokenData, agentAddress, "agent")
                        }
                        disabled={!hasUserBalance}
                        className="text-xs"
                      >
                        Deposit
                      </Button>

                      {/* Withdraw from Agent Account */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw(tokenData, agentBalance)}
                        disabled={!hasAgentBalance}
                        className="text-xs"
                      >
                        Withdraw
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Deposit Modal */}
      {depositRecipient && depositType && selectedToken && (
        <TokenDepositModal
          isOpen={depositModalOpen}
          onClose={() => {
            setDepositModalOpen(false);
            setSelectedToken(null);
            setDepositRecipient(null);
            setDepositType(null);
          }}
          recipientAddress={depositRecipient}
          recipientType={depositType}
          tokenData={selectedToken}
        />
      )}

      {/* Withdraw Modal */}
      {selectedToken && (
        <TokenWithdrawModal
          isOpen={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedToken(null);
          }}
          agentAddress={agentAddress}
          tokenData={selectedToken}
        />
      )}
    </>
  );
}
