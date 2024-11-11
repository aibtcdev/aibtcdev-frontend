"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrewChat } from "@/hooks/useCrewChat";
import { MessageBubble } from "../chat/MessageBubble";
import { Skeleton } from "../ui/skeleton";
import { ChatInput } from "../chat/ChatInput";
import { useEffect } from "react";

interface ExecutionPanelProps {
  crewName: string;
  crewId: number;
}

export default function ExecutionPanel({
  crewName,
  crewId,
}: ExecutionPanelProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    messagesEndRef,
    handleResetHistory,
    setCrewId,
  } = useCrewChat();

  useEffect(() => {
    setCrewId(crewId);
  }, [crewId]);

  return (
    <Card className="w-full">
      <CardContent className="space-y-4 p-4">
        <div className="h-[550px] overflow-y-auto space-y-4">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {isLoading && (
            <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
