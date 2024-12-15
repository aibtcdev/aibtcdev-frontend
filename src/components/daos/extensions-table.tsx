"use client";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  MessageSquare,
  CircleDollarSign,
  HelpCircle,
  Settings2,
  Play,
  ArrowUpRight,
  BarChart3,
  Gavel,
  ShoppingCart,
  Gem,
  Shield,
  ArrowsUpFromLine,
  Coins,
  LayoutGrid,
  MoreVertical,
  AlertTriangle,
  StopCircle,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Extension {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string;
  lastUsed: string;
}

interface ExtensionsTableProps {
  extensions: Extension[];
}

// Map extension types to icons
const extensionIcons: Record<string, JSX.Element> = {
  treasury: <Wallet className="h-4 w-4" />,
  payments: <CircleDollarSign className="h-4 w-4" />,
  messaging: <MessageSquare className="h-4 w-4" />,
  governance: <Gavel className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  trading: <ShoppingCart className="h-4 w-4" />,
  defi: <Coins className="h-4 w-4" />,
  nft: <Gem className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  bridge: <ArrowsUpFromLine className="h-4 w-4" />,
  staking: <Coins className="h-4 w-4" />,
};

const getStatusColor = (status: string) => {
  return status === "Active" ? "bg-green-500" : "bg-gray-500";
};

function ActivateExtensionDialog({
  extension,
  isOpen,
  onClose,
  onConfirm,
}: {
  extension: Extension;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Make API call to generate contract
      const response = await fetch("/api/daos/extensions/treasury/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "aibtcdev",
          daoContractId:
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-dao",
          extensionTraitContractId:
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-extension-trait",
          sip009TraitContractId:
            "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait",
          sip010TraitContractId:
            "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard",
        }),
      });

      const data = await response.json();
      console.log("Generated Treasury Contract:", data.contract);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate contract");
      }

      onConfirm();
    } catch (error) {
      console.error("Error activating extension:", error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate Extension</DialogTitle>
          <DialogDescription>
            Are you sure you want to activate the {extension.name} extension?
            This will enable its functionality within your DAO.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg border bg-muted p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Please Note</p>
                <p className="text-sm text-muted-foreground">
                  This action will require a transaction to be signed and cannot
                  be undone without another transaction.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Activating..." : "Confirm Activation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ExtensionsTable({ extensions }: ExtensionsTableProps) {
  const router = useRouter();
  const [activatingExtension, setActivatingExtension] =
    useState<Extension | null>(null);

  const handleActivate = (extension: Extension) => {
    setActivatingExtension(extension);
  };

  const handleActivateConfirm = () => {
    console.log("Extension activated:", activatingExtension?.name);
  };

  const handleConfigure = (extension: Extension) => {
    // Route to specific configuration page based on extension type
    router.push(`/daos/${extension.id}/${extension.type}/configure`);
  };

  const renderActionMenu = (extension: Extension) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {extension.status === "Inactive" ? (
          <DropdownMenuItem onClick={() => handleActivate(extension)}>
            <Play className="h-4 w-4 mr-2" /> Activate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <StopCircle className="h-4 w-4 mr-2" /> Deactivate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleConfigure(extension)}>
          <Settings2 className="h-4 w-4 mr-2" /> Configure
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ArrowUpRight className="h-4 w-4 mr-2" /> View on Explorer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
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
                    {extensionIcons[extension.type] || (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                    <span className="ml-2">{extension.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {extension.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        extension.status
                      )} mr-2`}
                    />
                    {extension.status}
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  {extension.lastUsed}
                </TableCell>
                <TableCell className="text-right">
                  {renderActionMenu(extension)}
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
                  {extensionIcons[extension.type] || (
                    <LayoutGrid className="h-4 w-4" />
                  )}
                  <h3 className="text-lg font-semibold ml-2">
                    {extension.name}
                  </h3>
                </div>
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      extension.status
                    )} mr-2`}
                  />
                  {extension.status}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {extension.description}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last used: {extension.lastUsed}</span>
                {renderActionMenu(extension)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {activatingExtension && (
        <ActivateExtensionDialog
          extension={activatingExtension}
          isOpen={true}
          onClose={() => setActivatingExtension(null)}
          onConfirm={handleActivateConfirm}
        />
      )}
    </div>
  );
}
