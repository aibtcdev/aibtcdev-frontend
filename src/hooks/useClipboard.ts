import { useState } from "react";
import { useToast } from "@/hooks/useToast";

/**
 * Hook for copying text to clipboard with toast notifications
 * @returns Object with copiedText state and copyToClipboard function
 */
export function useClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Copies text to clipboard and shows success/error toast
   * @param text - The text to copy to clipboard
   * @returns Promise<boolean> - Success status
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);

      return true;
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    copiedText,
    copyToClipboard,
  };
}
