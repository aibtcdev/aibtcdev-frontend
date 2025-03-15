"use client";
import React from "react";
import { MessageSquare } from "lucide-react";
import { deserializeCV, cvToString } from "@stacks/transactions";

interface MessageDisplayProps {
  message: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  let decodedMessage = "";
  try {
    if (!message)
      return (
        <div className="p-3 rounded-md  flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
          <p className="text-sm sm:text-base">No message available</p>
        </div>
      );

    const hexValue = message.startsWith("0x") ? message.slice(2) : message;
    const clarityValue = deserializeCV(Buffer.from(hexValue, "hex"));
    decodedMessage = cvToString(clarityValue);
  } catch (error) {
    decodedMessage = `Unable to decode message: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  return (
    <div className="rounded-md bg-zinc-800 overflow-hidden">
      <div className="flex items-center px-3 py-2">
        <MessageSquare className="h-4 w-4 mr-2" />
        <h3 className="text-sm sm:text-base font-medium">Message</h3>
      </div>
      <div className="p-3 sm:p-4 text-sm sm:text-base break-words">
        {decodedMessage}
      </div>
    </div>
  );
};

export default MessageDisplay;
