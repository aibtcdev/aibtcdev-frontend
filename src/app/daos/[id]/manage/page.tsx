"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/catalyst/heading";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Wallet,
  MessageSquare,
  CircleDollarSign,
  ArrowUpRight,
  Check,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function DaoManagement() {
  const [isLoading] = useState(false);

  // Example extension data
  const extensions = [
    {
      id: 1,
      name: "Treasury",
      type: "treasury",
      description: "Manages DAO assets and funds",
      status: "Active",
      lastUsed: "2024-03-15",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: 2,
      name: "Payments",
      type: "payments",
      description: "Handles payments and resource management",
      status: "Active",
      lastUsed: "2024-03-14",
      icon: <CircleDollarSign className="h-4 w-4" />,
    },
    {
      id: 3,
      name: "Messaging",
      type: "messaging",
      description: "On-chain communication system",
      status: "Active",
      lastUsed: "2024-03-13",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex w-full flex-wrap items-end justify-between gap-4 pb-6">
        <Heading>DAO Management</Heading>
        <Button variant="outline">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          View on Explorer
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 mr-2" />
                  <span className="font-medium">Treasury Balance</span>
                </div>
                <span className="text-xl font-bold">1,234 STX</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  <span className="font-medium">Total Revenue</span>
                </div>
                <span className="text-xl font-bold">5,678 STX</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span className="font-medium">Active Extensions</span>
                </div>
                <span className="text-xl font-bold">3/3</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Extensions</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{`Manage your DAO's active extensions`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Desktop view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-full">Description</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[150px]">Last Used</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extensions.map((extension) => (
                <TableRow key={extension.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {extension.icon}
                      <span className="ml-2">{extension.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {extension.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      {extension.status}
                    </div>
                  </TableCell>
                  <TableCell>{extension.lastUsed}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {extensions.map((extension) => (
            <div
              key={extension.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {extension.icon}
                    <h3 className="text-lg font-semibold ml-2">
                      {extension.name}
                    </h3>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    {extension.status}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {extension.description}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Last used: {extension.lastUsed}</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Bank Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Withdrawal Period (blocks)
                </label>
                <input
                  type="number"
                  defaultValue={144}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Withdrawal Amount (STX)
                </label>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
