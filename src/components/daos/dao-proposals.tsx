import { useState } from "react";
import { deserializeCV, cvToString } from "@stacks/transactions";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import {
  Timer,
  CheckCircle2,
  FileEdit,
  XCircle,
  Filter,
  Hash,
  Wallet,
  Calendar,
  User,
  Activity,
  Layers,
  ArrowRight,
  Copy,
  CheckIcon,
  MessageSquare,
  Info,
} from "lucide-react";

interface DAOProposalsProps {
  proposals: Proposal[];
}

const StatusBadge = ({ status }: { status: Proposal["status"] }) => {
  const config = {
    DRAFT: {
      color: "bg-gray-500/10 text-gray-500",
      icon: FileEdit,
      label: "Draft",
      tooltip: "This proposal is in draft state and not yet active",
    },
    PENDING: {
      color: "bg-blue-500/10 text-blue-500",
      icon: Timer,
      label: "Pending",
      tooltip: "This proposal is waiting for AI agents to vote",
    },
    DEPLOYED: {
      color: "bg-green-500/10 text-green-500",
      icon: CheckCircle2,
      label: "Deployed",
      tooltip: "This proposal has been approved and deployed by AI agents",
    },
    FAILED: {
      color: "bg-red-500/10 text-red-500",
      icon: XCircle,
      label: "Failed",
      tooltip: "This proposal failed to receive enough support from AI agents",
    },
  };

  const { color, icon: Icon, label, tooltip } = config[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`${color} text-sm`}>
            <span className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const truncateString = (
  str: string,
  startLength: number,
  endLength: number
) => {
  if (!str) return "";
  if (str.length <= startLength + endLength) return str;
  return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
};

const formatAction = (action: string) => {
  if (!action) return "";
  const parts = action.split(".");
  if (parts.length <= 1) return action.toUpperCase();
  return parts[parts.length - 1].toUpperCase();
};

const getExplorerLink = (type: string, value: string) => {
  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  const testnetParam = isTestnet ? "?chain=testnet" : "";

  switch (type) {
    case "tx":
      return `http://explorer.hiro.so/txid/${value}${testnetParam}`;
    case "address":
      return `http://explorer.hiro.so/address/${value}${testnetParam}`;
    case "contract":
      return `http://explorer.hiro.so/txid/${value}${testnetParam}`;
    default:
      return "";
  }
};

const BlockVisual = ({
  value,
  type = "stacks",
}: {
  value: number | null;
  type?: "stacks" | "bitcoin";
}) => {
  if (value === null) return <span className="text-sm">N/A</span>;

  const color = type === "stacks" ? "bg-orange-500" : "bg-yellow-500";
  const icon =
    type === "stacks" ? (
      <div className={`w-2 h-2 rounded-sm ${color} mr-1.5`} />
    ) : (
      <div className={`w-2 h-2 rounded-full ${color} mr-1.5`} />
    );

  const label = type === "stacks" ? "STX" : "BTC";
  const tooltip =
    type === "stacks"
      ? "Block height on the Stacks blockchain"
      : "Block height on the Bitcoin blockchain";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {icon}
            <span className="text-sm">{value.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground ml-1">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const LabeledField = ({
  icon: Icon,
  label,
  value,
  copy,
  tooltip,
  link,
  showTooltip = true,
  showCopy = true,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  copy?: string;
  tooltip?: string;
  link?: string;
  showTooltip?: boolean;
  showCopy?: boolean;
}) => {
  const content = (
    <div className="flex flex-wrap items-center gap-2 text-muted-foreground my-3">
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-sm text-muted-foreground">
        {label}:
      </span>
      <span className="break-all text-sm">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-blue-500 dark:text-blue-400"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </span>
      {copy && showCopy && <CopyButton text={copy} />}
      {tooltip && showTooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  return content;
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
};

const MessageDisplay = ({ message }: { message: string }) => {
  try {
    if (!message)
      return (
        <p className="text-center text-muted-foreground text-sm py-4">
          No message available
        </p>
      );

    const hexValue = message.startsWith("0x") ? message.slice(2) : message;
    const clarityValue = deserializeCV(Buffer.from(hexValue, "hex"));
    const decodedMessage = cvToString(clarityValue);

    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 mt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <h4 className="font-medium text-blue-700 dark:text-blue-400 text-sm">
            Message
          </h4>
        </div>
        <p className="text-sm">{decodedMessage}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-800 mt-4 mb-4">
        <p className="text-sm text-muted-foreground">
          Unable to decode message:{" "}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
};

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const getEstimatedEndDate = (createdAt: string): Date => {
    const start = new Date(createdAt);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold leading-none tracking-tight">
                {proposal.title}
              </h3>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {proposal.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-1">
        {proposal.parameters && (
          <MessageDisplay message={proposal.parameters} />
        )}

        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-1 mb-4 lg:mb-0">
            <h4 className="font-medium text-sm mb-2">Timing & Blocks</h4>
            <LabeledField
              icon={Calendar}
              label="Created"
              value={format(new Date(proposal.created_at), "PPp")}
            />
            <LabeledField
              icon={Timer}
              label="Ends"
              value={format(getEstimatedEndDate(proposal.created_at), "PPp")}
            />
            <LabeledField
              icon={Layers}
              label="Snapshot block"
              value={
                <BlockVisual value={proposal.created_at_block} type="stacks" />
              }
              tooltip="The Stacks block at which this proposal was created"
            />
            <LabeledField
              icon={ArrowRight}
              label="Start block"
              value={
                <BlockVisual value={proposal.start_block} type="bitcoin" />
              }
              tooltip="The Bitcoin block at which this proposal became active"
            />
            <LabeledField
              icon={Timer}
              label="End block"
              value={<BlockVisual value={proposal.end_block} type="bitcoin" />}
              tooltip="The Bitcoin block at which this proposal will end"
            />
          </div>

          <div className="space-y-1">
            <div className="block lg:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="py-2 text-sm font-medium hover:bg-muted/50 rounded-md transition-colors">
                    <span className="flex items-center gap-2">See More</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm mb-2">
                        Blockchain Details
                      </h4>
                      <LabeledField
                        icon={User}
                        label="Creator"
                        value={truncateString(proposal.creator, 8, 8)}
                        link={getExplorerLink("address", proposal.creator)}
                        showTooltip={false}
                        showCopy={false}
                      />
                      <LabeledField
                        icon={Activity}
                        label="Action"
                        value={formatAction(proposal.action)}
                        link={
                          proposal.action
                            ? getExplorerLink("contract", proposal.action)
                            : undefined
                        }
                        showTooltip={false}
                        showCopy={false}
                      />
                      <LabeledField
                        icon={Hash}
                        label="Transaction ID"
                        value={truncateString(proposal.tx_id, 8, 8)}
                        link={getExplorerLink("tx", proposal.tx_id)}
                        showTooltip={false}
                        showCopy={false}
                      />
                      <LabeledField
                        icon={Wallet}
                        label="Principal"
                        value={formatAction(proposal.contract_principal)}
                        link={getExplorerLink(
                          "contract",
                          proposal.contract_principal
                        )}
                        showTooltip={false}
                        showCopy={false}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="hidden lg:block space-y-1">
              <h4 className="font-medium text-sm mb-2">Blockchain Details</h4>
              <LabeledField
                icon={User}
                label="Creator"
                value={truncateString(proposal.creator, 8, 8)}
                link={getExplorerLink("address", proposal.creator)}
                showTooltip={false}
                showCopy={false}
              />
              <LabeledField
                icon={Activity}
                label="Action"
                value={formatAction(proposal.action)}
                link={
                  proposal.action
                    ? getExplorerLink("contract", proposal.action)
                    : undefined
                }
                showTooltip={false}
                showCopy={false}
              />
              <LabeledField
                icon={Hash}
                label="Transaction ID"
                value={truncateString(proposal.tx_id, 8, 8)}
                link={getExplorerLink("tx", proposal.tx_id)}
                showTooltip={false}
                showCopy={false}
              />
              <LabeledField
                icon={Wallet}
                label="Principal"
                value={formatAction(proposal.contract_principal)}
                link={getExplorerLink("contract", proposal.contract_principal)}
                showTooltip={false}
                showCopy={false}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function DAOProposals({ proposals }: DAOProposalsProps) {
  const [statusFilter, setStatusFilter] = useState<Proposal["status"] | "all">(
    "all"
  );

  const filteredProposals = proposals.filter(
    (proposal) => statusFilter === "all" || proposal.status === statusFilter
  );

  const stats = {
    active: proposals.filter((p) => p.status === "DEPLOYED").length,
    pending: proposals.filter((p) => p.status === "PENDING").length,
    draft: proposals.filter((p) => p.status === "DRAFT").length,
    failed: proposals.filter((p) => p.status === "FAILED").length,
    total: proposals.length,
    successRate: (() => {
      const totalCompletedProposals = proposals.filter(
        (p) => p.status === "DEPLOYED" || p.status === "FAILED"
      ).length;
      if (totalCompletedProposals === 0) return 0;
      return Math.round(
        (proposals.filter((p) => p.status === "DEPLOYED").length /
          totalCompletedProposals) *
          100
      );
    })(),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proposals</h2>
          <p className="text-muted-foreground mt-2">
            View and manage your DAO&apos;s governance proposals
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Active Proposals
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="text-2xl font-bold">{stats.active}</div>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-500/10 text-green-500"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Deployed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Pending Proposals
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-500/10 text-blue-500"
                >
                  <Timer className="h-4 w-4 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Success Rate
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-sm text-muted-foreground">
                Of completed proposals
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Proposals
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex gap-1 mt-1">
                <Badge variant="outline" className="text-sm">
                  {stats.draft} drafts
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {stats.failed} failed
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Proposals</h3>
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

          {filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <CardDescription>
                No proposals found with the selected filter.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DAOProposals };
export default DAOProposals;
