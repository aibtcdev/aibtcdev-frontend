"use client";

import React from "react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Skeleton } from "@/components/ui/skeleton";

export default function Chat() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    handleResetHistory,
    messagesEndRef,
  } = useChat();

  return (
    <div className="w-screen md:h-[98vh] h-[91vh]">
      <div className="flex h-full">
        <div className="flex flex-col flex-1 h-auto overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 px-4 py-2">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isLoading && (
              <div className="space-y-4 animate-pulse">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onReset={handleResetHistory}
          />
        </div>
      </div>
    </div>
  );
}