import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/hooks/useChat";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => (
  <div
    className={`flex ${
      message.role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`max-w-[70%] p-3 rounded-lg ${
        message.role === "user"
          ? "bg-primary text-primary-foreground ml-4"
          : message.type === "task"
          ? "bg-blue-100 dark:bg-blue-900"
          : message.type === "result"
          ? "bg-green-100 dark:bg-green-900"
          : "bg-muted"
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {message.content}
      </ReactMarkdown>
      <div className="text-xs uppercase mt-5 text-muted-foreground">
        {String(message.timestamp)}
      </div>
      {message.tokenUsage && (
        <div className="text-xs text-muted-foreground mt-2">
          Token usage: {message.tokenUsage.total_tokens}
        </div>
      )}
    </div>
  </div>
);
