"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/useClipboard";

interface MessageDisplayProps {
  message?: string;
}

const MessageDisplay = ({ message }: MessageDisplayProps) => {
  const { copiedText, copyToClipboard } = useClipboard();
  const isCopied = copiedText === message;

  // Handle empty message
  if (!message) {
    return (
      <div className="text-xs text-muted-foreground">No message available</div>
    );
  }

  return (
    <div className="relative">
      <div className="p-2 rounded  text-xs break-words whitespace-pre-wrap">
        {message}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 absolute top-1 right-1 opacity-70 hover:opacity-100 hover:bg-zinc-700"
          onClick={() => copyToClipboard(message)}
          aria-label="Copy to clipboard"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageDisplay;
