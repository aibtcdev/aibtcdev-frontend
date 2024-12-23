"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
// import { dao } from "@aibtcdev/tools";
import type { ExtendedDAO } from "@aibtcdev/tools";
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
import { AlertCircle, ArrowUpRight, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { Badge } from "@/components/ui/badge";

interface DaosTableProps {
  daos: ExtendedDAO[];
}

export default function DaosTable({ daos }: DaosTableProps) {
  const router = useRouter();
  const [error] = useState<string | null>(null);

  // const getTypeIcon = (type: ExtendedDAO["type"]) => {
  //   switch (type) {
  //     case "trading":
  //       return <LineChart className="h-4 w-4" />;
  //     case "yield":
  //       return <Router className="h-4 w-4" />;
  //     case "arbitrage":
  //       return <ArrowUpRight className="h-4 w-4" />;
  //     case "monitoring":
  //       return <Bot className="h-4 w-4" />;
  //     default:
  //       return null;
  //   }
  // };

  // const getStatusBadge = (status: ExtendedDAO["status"]) => {
  //   const variants = {
  //     active: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  //     paused: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  //     configuring: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  //   };

  //   return (
  //     <Badge variant="outline" className={variants[status]}>
  //       {status.charAt(0).toUpperCase() + status.slice(1)}
  //     </Badge>
  //   );
  // };

  // const handleRowClick = (daoId: string) => {
  //   router.push(`/daos/${daoId}/manage`);
  // };

  // const handleManageClick = (e: React.MouseEvent, daoId: string) => {
  //   e.stopPropagation();
  //   router.push(`/daos/${daoId}/manage`);
  // };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Desktop view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              {/* <TableHead className="w-full">Description</TableHead> */}
              {/* <TableHead className="w-[150px]">Status</TableHead> */}
              {/* <TableHead className="w-[120px] text-right">Treasury</TableHead> */}
              {/* <TableHead className="w-[100px] text-center">Agents</TableHead> */}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daos.map((dao) => (
              <TableRow
                key={dao.id}
                // className="cursor-pointer hover:bg-accent/50"
                // onClick={() => handleRowClick(dao.id)}
              >
                <TableCell className="font-medium min-w-[250px]">
                  <div className="flex items-center gap-2">
                    {/* {getTypeIcon(dao.type)} */}
                    <span>{dao.name}</span>
                    {/* <TooltipProvider>
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
                    </TooltipProvider> */}
                  </div>
                </TableCell>
                {/* <TableCell className="max-w-md truncate">
                  {dao.description}
                </TableCell> */}
                {/* <TableCell>{getStatusBadge(dao.status)}</TableCell> */}
                {/* <TableCell className="text-right min-w-[150px]">
                  {dao.treasury.toLocaleString()} STX
                </TableCell> */}
                {/* <TableCell className="text-center">{dao.agents}</TableCell> */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem
                      onClick={(e) => handleManageClick(e, dao.id)}
                      >
                        <Settings2 className="h-4 w-4 mr-2" /> Manage
                      </DropdownMenuItem> */}
                      {/* <DropdownMenuItem>
                        <Play className="h-4 w-4 mr-2" /> Execute
                      </DropdownMenuItem> */}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `https://explorer.hiro.so/txid/${dao.id}?chain=testnet`
                          );
                        }}
                      >
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
                  {/* {getTypeIcon(dao.type)} */}
                  <h3 className="text-lg font-semibold">{dao.name}</h3>
                  {/* {dao.is_public ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )} */}
                </div>
                {/* {getStatusBadge(dao.status)} */}
              </div>
              {/* <p className="text-sm text-muted-foreground mb-4">
                {dao.description}
              </p> */}
              {/* <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Treasury</p>
                  <p className="font-medium">
                    {dao.treasury.toLocaleString()} STX
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                  <p className="font-medium">{dao.agents}</p>
                </div>
              </div> */}
              {/* <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/daos/${dao.id}/manage`)}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
