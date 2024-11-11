"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { Crew } from "@/types/supabase";

interface StreamMessage {
  type: "task" | "step" | "result";
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokenUsage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    successful_requests: number;
  };
  streamMessages?: StreamMessage[];
}

export default function DashboardChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [conversationId, setConverationId] = useState<string | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<StreamMessage[]>(
    []
  );

  const scrollToBottom = () => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  const handleResetHistory = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMessages([]);
      setStreamingMessages([]);
      setConverationId(null);
      toast({
        title: "Success",
        description: "Chat history has been reset.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to reset chat history:", error);
      toast({
        title: "Error",
        description: "Failed to reset chat history.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!authToken) return;

      try {
        const conversationRequest = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/latest`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!conversationRequest.ok) {
          throw new Error(`HTTP error! status: ${conversationRequest.status}`);
        }

        const conversationData = await conversationRequest.json();
        setConverationId(conversationData.id);

        const detaildConversationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationData.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!detaildConversationResponse.ok) {
          throw new Error(
            `HTTP error! status: ${detaildConversationResponse.status}`
          );
        }

        const detailedConversationData =
          await detaildConversationResponse.json();

        // Map the history messages to the Message format
        const formattedJobs = detailedConversationData.jobs.map((job: any) => ({
          id: job.id,
          created_at: job.created_at,
          conversation_id: job.conversation_id,
          crew_id: job.crew_id,
          profile_id: job.profile_id,
          input: job.input,
          result: job.result,
          messages: job.messages.map((msg: string) => {
            const parsedMsg = JSON.parse(msg);
            return {
              role: parsedMsg.role as "user" | "assistant", // Ensure the role matches the expected type
              content: parsedMsg.content,
              timestamp: new Date(parsedMsg.timestamp), // Convert timestamp to Date object
            };
          }),
        }));

        // Set the initial message and history messages
        const initialMessage: Message = {
          role: "assistant",
          content: "How can I help you today?",
          timestamp: new Date(),
        };

        setMessages([initialMessage, ...formattedJobs[0].messages]);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        toast({
          title: "Error",
          description: "Failed to load chat history.",
          variant: "destructive",
        });
      }
    };

    fetchHistory();
  }, [authToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessages]);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setAuthToken(session.access_token);
      }
    };

    getSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingMessages([]);

    try {
      // Get a connection token
      const tokenResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat?conversation_id=${conversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(input),
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`HTTP error! status: ${tokenResponse.status}`);
      }

      const { job_id } = await tokenResponse.json();

      // Start SSE connection
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${job_id}/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          console.log("Raw SSE data:", event.data);
          if (!event.data || event.data.trim() === "") {
            console.log("Received empty SSE event, skipping");
            return;
          }

          const data = JSON.parse(event.data);
          if (!data || typeof data !== "object") {
            console.warn("Parsed data is not an object:", data);
            return;
          }

          switch (data.type) {
            case "step":
            case "task":
            case "result":
              setStreamingMessages((prev) => [
                ...prev,
                { type: data.type, content: data.content },
              ]);
              break;
            default:
              console.warn("Unknown message type:", data.type);
          }

          // Close the connection quietly if a "result" message is received
          if (data.type === "result") {
            eventSource.close();
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
          console.error("Raw data that failed to parse:", event.data);
        }
      };

      // Handle errors but only show if it's an unexpected failure
      eventSource.onerror = (error) => {
        if (isLoading) {
          console.warn("SSE connection closed after completion");
          setIsLoading(false);
        } else {
          console.error("EventSource failed:", error);
          toast({
            title: "Connection Failed",
            description:
              "There was a problem with the connection. Please try again.",
            variant: "destructive",
          });
        }
      };

      eventSource.addEventListener("finish", () => {
        eventSource.close();
        setIsLoading(false);

        const assistantMessage: Message = {
          role: "assistant",
          content: "Task completed",
          timestamp: new Date(),
          streamMessages: streamingMessages,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingMessages([]);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-4 p-4">
        <div className="h-[550px] overflow-y-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-4"
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
          ))}
          {streamingMessages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[70%] space-y-2">
                {streamingMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.type === "task"
                        ? "bg-blue-100 dark:bg-blue-900"
                        : msg.type === "result"
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-xs uppercase mb-1 text-muted-foreground">
                      {msg.type}
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isLoading && streamingMessages.length === 0 && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
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
          <Button onClick={handleResetHistory} variant="destructive">
            Reset
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
