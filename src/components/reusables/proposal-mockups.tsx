"use client";
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  Timer,
  CheckCircle2,
  FileEdit,
  XCircle,
  Link as LinkIcon,
  Code,
  DollarSign,
  ExternalLink,
  Filter,
  Hash,
  Building,
  Wallet,
} from "lucide-react";

interface Proposal {
  id: string;
  created_at: string;
  title: string;
  description: string;
  code: string | null;
  link: string | null;
  monetary_ask: null;
  status: "DRAFT" | "PENDING" | "DEPLOYED" | "FAILED";
  contract_principal: string;
  tx_id: string;
  dao_id: string;
}

// Sample Data
const SAMPLE_PROPOSALS: Proposal[] = [
  {
    id: "1",
    created_at: "2024-02-23T10:00:00Z",
    title: "Implement Smart Contract Upgrades",
    description:
      "Proposal to upgrade our core smart contracts to implement new security features and optimizations. This includes improvements to the voting mechanism and better gas efficiency for common operations.",
    code: "contract.clar",
    link: "https://docs.example.com/proposal-1",
    monetary_ask: null,
    status: "DEPLOYED",
    contract_principal: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    tx_id: "0x1234567890abcdef",
    dao_id: "dao_main",
  },
  {
    id: "2",
    created_at: "2024-02-24T08:30:00Z",
    title: "Treasury Allocation for Q2 2024",
    description:
      "Proposal to allocate 100,000 tokens from the treasury for Q2 2024 initiatives, including developer grants, marketing campaigns, and community events. Detailed breakdown of planned expenditures included.",
    code: null,
    link: null,
    monetary_ask: null,
    status: "PENDING",
    contract_principal: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    tx_id: "0xabcdef1234567890",
    dao_id: "dao_main",
  },
  {
    id: "3",
    created_at: "2024-02-22T15:45:00Z",
    title: "Governance Parameter Updates",
    description:
      "Draft proposal to adjust governance parameters including voting period duration, quorum requirements, and proposal submission thresholds. Aims to improve participation and decision-making efficiency.",
    code: "params.clar",
    link: "https://forum.example.com/governance-updates",
    monetary_ask: null,
    status: "DRAFT",
    contract_principal: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    tx_id: "0x2468101214161820",
    dao_id: "dao_main",
  },
  {
    id: "4",
    created_at: "2024-02-21T09:15:00Z",
    title: "Community Rewards Program",
    description:
      "Failed proposal to implement a new community rewards program. The program aimed to distribute tokens to active contributors based on participation metrics and contribution quality.",
    code: "rewards.clar",
    link: null,
    monetary_ask: null,
    status: "FAILED",
    contract_principal: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    tx_id: "0x1357911131517919",
    dao_id: "dao_main",
  },
  {
    id: "5",
    created_at: "2024-02-24T11:20:00Z",
    title: "Protocol Integration Partnership",
    description:
      "Proposal to integrate with DeFi protocol XYZ to expand our ecosystem's capabilities. This integration would enable new features including cross-chain transactions and improved liquidity options.",
    code: "integration.clar",
    link: "https://xyz.protocol.com/integration",
    monetary_ask: null,
    status: "PENDING",
    contract_principal: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    tx_id: "0x9876543210fedcba",
    dao_id: "dao_main",
  },
];

interface DAOProposalsProps {
  proposals?: Proposal[];
}

const StatusBadge = ({ status }: { status: Proposal["status"] }) => {
  const config = {
    DRAFT: {
      color: "bg-gray-500/10 text-gray-500",
      icon: FileEdit,
      label: "Draft",
    },
    PENDING: {
      color: "bg-blue-500/10 text-blue-500",
      icon: Timer,
      label: "Pending",
    },
    DEPLOYED: {
      color: "bg-green-500/10 text-green-500",
      icon: CheckCircle2,
      label: "Deployed",
    },
    FAILED: {
      color: "bg-red-500/10 text-red-500",
      icon: XCircle,
      label: "Failed",
    },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <Badge variant="secondary" className={`${color} text-xs sm:text-sm`}>
      <span className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        {label}
      </span>
    </Badge>
  );
};

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEstimatedEndDate = (createdAt: string): Date => {
    const start = new Date(createdAt);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  };

  const truncateString = (str: string, length: number) => {
    if (str.length <= length) return str;
    return `${str.substring(0, length)}...`;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {proposal.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isExpanded
                ? proposal.description
                : truncateString(proposal.description, 100)}
            </p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>
                  Created: {format(new Date(proposal.created_at), "PPp")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>
                  Ends:{" "}
                  {format(getEstimatedEndDate(proposal.created_at), "PPp")}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {proposal.code && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Code className="h-4 w-4" />
                        <span>Code: {proposal.code}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>File: {proposal.code}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {proposal.link && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  <a
                    href={proposal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    External reference
                  </a>
                </div>
              )}
              {proposal.monetary_ask && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Includes funding request</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="font-mono">TX: {proposal.tx_id}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="font-mono">
                Principal: {proposal.contract_principal}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <span className="font-mono">DAO: {proposal.dao_id}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

function DAOProposals({ proposals = SAMPLE_PROPOSALS }: DAOProposalsProps) {
  const [statusFilter, setStatusFilter] = useState<Proposal["status"] | "all">(
    "all"
  );

  const filteredProposals = proposals.filter(
    (proposal) => statusFilter === "all" || proposal.status === statusFilter
  );

  const stats = {
    active: proposals.filter((p) => p.status === "DEPLOYED").length,
    total: proposals.length,
    successRate:
      proposals.length > 1
        ? Math.round(
            (proposals.filter((p) => p.status === "DEPLOYED").length /
              proposals.filter((p) => p.status !== "DEPLOYED").length) *
              100
          )
        : 100,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <CardHeader className="p-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader className="p-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Success Rate
            </h3>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader className="p-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Proposals</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as Proposal["status"] | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Proposals</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="DEPLOYED">Deployed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </div>
  );
}

export default DAOProposals;
