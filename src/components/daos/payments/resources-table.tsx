"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { PlusCircle } from "lucide-react";

interface Resource {
  id: number;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  createdAt: string;
  totalSpent: number;
  totalUsed: number;
}

interface ResourcesTableProps {
  resources: Resource[];
}

export default function ResourcesTable({ resources }: ResourcesTableProps) {
  const formatSTX = (amount: number) => {
    return `${(amount / 1000000).toLocaleString()} STX`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Resources</h2>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Total Revenue</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell className="font-medium">{resource.name}</TableCell>
              <TableCell>{resource.description}</TableCell>
              <TableCell>{formatSTX(resource.price)}</TableCell>
              <TableCell>{formatSTX(resource.totalSpent)}</TableCell>
              <TableCell>{resource.totalUsed}</TableCell>
              <TableCell>
                <Switch checked={resource.enabled} onCheckedChange={() => {}} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
