"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowUpRight,
  Globe,
  Lock,
  MoreVertical,
  Play,
  Settings2,
  Bot,
  LineChart,
  Router,
  PlusIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/catalyst/heading";

// Extended DAO type with additional fields
interface ExtendedDAO {
  id: number;
  name: string;
  created_at: string;
  is_public: boolean;
  profile_id: string;
  status: "active" | "paused" | "configuring";
  type: "trading" | "arbitrage" | "yield" | "monitoring";
  treasury: number;
  agents: number;
  last_active: string;
  description: string;
}

const exampleDaos: ExtendedDAO[] = [
  {
    id: 1,
    name: "BTC Market Sentinel",
    description:
      "AI-driven Bitcoin market analysis and trading strategy execution",
    created_at: "2024-03-01T00:00:00.000Z",
    is_public: true,
    profile_id: "1",
    status: "active",
    type: "trading",
    treasury: 25000,
    agents: 3,
    last_active: "2024-03-15T10:30:00.000Z",
  },
  {
    id: 2,
    name: "Yield Optimizer DAO",
    description:
      "Automated yield farming and liquidity provision across Stacks DeFi",
    created_at: "2024-02-15T00:00:00.000Z",
    is_public: false,
    profile_id: "1",
    status: "active",
    type: "yield",
    treasury: 150000,
    agents: 5,
    last_active: "2024-03-15T11:45:00.000Z",
  },
  {
    id: 3,
    name: "Cross-Chain Arbitrage",
    description:
      "Multi-chain arbitrage detection and execution with BTC/STX pairs",
    created_at: "2024-01-20T00:00:00.000Z",
    is_public: false,
    profile_id: "2",
    status: "paused",
    type: "arbitrage",
    treasury: 75000,
    agents: 4,
    last_active: "2024-03-14T22:15:00.000Z",
  },
  {
    id: 4,
    name: "Chain Analytics DAO",
    description: "On-chain data analysis and market intelligence gathering",
    created_at: "2024-02-28T00:00:00.000Z",
    is_public: true,
    profile_id: "1",
    status: "configuring",
    type: "monitoring",
    treasury: 5000,
    agents: 2,
    last_active: "2024-03-15T09:20:00.000Z",
  },
];

export default function Daos() {
  const [daos] = useState<ExtendedDAO[]>(exampleDaos);
  const [error] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getTypeIcon = (type: ExtendedDAO["type"]) => {
    switch (type) {
      case "trading":
        return <LineChart className="h-4 w-4" />;
      case "yield":
        return <Router className="h-4 w-4" />;
      case "arbitrage":
        return <ArrowUpRight className="h-4 w-4" />;
      case "monitoring":
        return <Bot className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ExtendedDAO["status"]) => {
    const variants = {
      active: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      paused: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
      configuring: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Your DAOs</Heading>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" /> Create DAO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New DAO</DialogTitle>
            </DialogHeader>
            {/* DAO creation form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        {/* Desktop view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead className="w-full">Description</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Treasury</TableHead>
                <TableHead className="w-[100px] text-center">Agents</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daos.map((dao) => (
                <TableRow key={dao.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(dao.type)}
                      <span>{dao.name}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {dao.is_public ? (
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{dao.is_public ? "Public" : "Private"} DAO</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {dao.description}
                  </TableCell>
                  <TableCell>{getStatusBadge(dao.status)}</TableCell>
                  <TableCell className="text-right">
                    {dao.treasury.toLocaleString()} STX
                  </TableCell>
                  <TableCell className="text-center">{dao.agents}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Play className="h-4 w-4 mr-2" /> Execute
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings2 className="h-4 w-4 mr-2" /> Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowUpRight className="h-4 w-4 mr-2" /> View on
                          Explorer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {daos.map((dao) => (
            <div
              key={dao.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(dao.type)}
                    <h3 className="text-lg font-semibold">{dao.name}</h3>
                    {dao.is_public ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {getStatusBadge(dao.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {dao.description}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Treasury</p>
                    <p className="font-medium">
                      {dao.treasury.toLocaleString()} STX
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Agents
                    </p>
                    <p className="font-medium">{dao.agents}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
