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
import { PlusCircle, Coins, Box } from "lucide-react";

interface Asset {
  address: string;
  enabled: boolean;
  type: "ft" | "nft";
  name: string;
  lastUsed?: string;
  balance?: number;
}

interface AllowedAssetsProps {
  assets: Asset[];
}

export default function AllowedAssets({ assets }: AllowedAssetsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Allowed Assets</h2>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Contract Address</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[150px]">Balance</TableHead>
            <TableHead className="w-[150px]">Last Used</TableHead>
            <TableHead className="w-[100px] text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.address}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {asset.type === "ft" ? (
                    <Coins className="h-4 w-4 mr-2" />
                  ) : (
                    <Box className="h-4 w-4 mr-2" />
                  )}
                  {asset.name}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {asset.address}
              </TableCell>
              <TableCell className="uppercase text-sm">{asset.type}</TableCell>
              <TableCell>{asset.balance?.toLocaleString() || "0"}</TableCell>
              <TableCell>{asset.lastUsed || "Never"}</TableCell>
              <TableCell className="text-right">
                <Switch checked={asset.enabled} onCheckedChange={() => {}} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
