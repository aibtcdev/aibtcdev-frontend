"use client";

import { Check, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getExplorerLink } from "@/utils/format";
import {
  WebSocketTransactionMessage,
  TransactionStatus,
} from "@/hooks/useTransactionVerification";

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  txId?: string;
  transactionStatus: TransactionStatus;
  transactionMessage?: WebSocketTransactionMessage | null;
  title?: string;
  successTitle?: string;
  failureTitle?: string;
  successDescription?: string;
  failureDescription?: string;
  pendingDescription?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function TransactionStatusModal({
  isOpen,
  onClose,
  txId,
  transactionStatus,
  transactionMessage,
  title = "Transaction Status",
  successTitle = "Transaction Confirmed",
  failureTitle = "Transaction Failed",
  successDescription = "Your transaction has been successfully confirmed on the blockchain.",
  failureDescription = "The transaction could not be completed. Please try again.",
  pendingDescription = "Your transaction is being processed on the blockchain. This may take a few minutes.",
  onRetry,
  showRetryButton = true,
}: TransactionStatusModalProps) {
  const getStatusBadge = () => {
    switch (transactionStatus) {
      case "success":
        return (
          <span className="px-3 py-1 rounded-sm text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Confirmed
          </span>
        );
      case "failed":
        return (
          <span className="px-3 py-1 rounded-sm text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-sm text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Processing
          </span>
        );
    }
  };

  const getIcon = () => {
    switch (transactionStatus) {
      case "success":
        return <Check className="w-8 h-8 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (transactionStatus) {
      case "success":
        return successTitle;
      case "failed":
        return failureTitle;
      default:
        return title;
    }
  };

  const getDescription = () => {
    switch (transactionStatus) {
      case "success":
        return successDescription;
      case "failed":
        return failureDescription;
      default:
        return pendingDescription;
    }
  };

  const getIconBgColor = () => {
    switch (transactionStatus) {
      case "success":
        return "bg-green-100";
      case "failed":
        return "bg-red-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 sm:max-w-lg">
        <div className="text-center py-8">
          <div
            className={`w-16 h-16 rounded-sm ${getIconBgColor()} flex items-center justify-center mx-auto mb-6`}
          >
            {getIcon()}
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold mb-2">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {getDescription()}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-4">
            {/* Transaction Status Card */}
            <div className="bg-background/50 border border-border/50 rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  Transaction Status
                </span>
                {getStatusBadge()}
              </div>

              {/* Show block height for successful transactions */}
              {transactionStatus === "success" &&
                transactionMessage?.block_height && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Block Height</span>
                    <span className="font-mono">
                      {transactionMessage.block_height.toLocaleString()}
                    </span>
                  </div>
                )}

              {/* Show transaction ID if available */}
              {txId && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">
                    {txId.slice(0, 8)}...{txId.slice(-8)}
                  </span>
                </div>
              )}

              {/* Show failure reason for failed transactions */}
              {transactionStatus === "failed" &&
                transactionMessage?.tx_result && (
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">Reason: </span>
                    <span className="font-medium">
                      {transactionMessage.tx_result.repr ||
                        "Transaction failed"}
                    </span>
                  </div>
                )}
            </div>

            <hr className="my-4 border-border/50" />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              {/* Retry button for failed transactions */}
              {transactionStatus === "failed" && onRetry && showRetryButton && (
                <Button variant="outline" onClick={onRetry}>
                  Try Again
                </Button>
              )}

              {/* Explorer link */}
              {txId && (
                <Button variant="outline" asChild>
                  <a
                    href={getExplorerLink("tx", txId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                </Button>
              )}

              {/* Close button */}
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
