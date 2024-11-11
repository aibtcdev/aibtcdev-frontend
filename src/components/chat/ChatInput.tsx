import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  isLoading,
  onSubmit,
  onReset,
}) => (
  <form onSubmit={onSubmit} className="flex gap-2">
    <Input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Type your message..."
      disabled={isLoading}
      className="flex-1"
    />
    <Button type="submit" disabled={isLoading}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Thinking...
        </div>
      ) : (
        "Send"
      )}
    </Button>
    <Button onClick={onReset} variant="destructive">
      Reset
    </Button>
  </form>
);
