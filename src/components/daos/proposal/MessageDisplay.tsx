"use client";
import type React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/helpers/clipboard-utils";

interface MessageDisplayProps {
  message?: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const { copiedText, copyToClipboard } = useClipboard();
  const isCopied = copiedText === message;

  // Handle empty message
  if (!message) {
    return (
      <div className="rounded-lg bg-zinc-900/50">
        <div className="mt-3 text-sm text-muted-foreground">
          No message available
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="p-3 rounded bg-zinc-800 text-sm break-words whitespace-pre-wrap">
        {message}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 absolute top-2 right-2 opacity-70 hover:opacity-100 hover:bg-zinc-700"
          onClick={() => copyToClipboard(message)}
          aria-label="Copy to clipboard"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageDisplay;
