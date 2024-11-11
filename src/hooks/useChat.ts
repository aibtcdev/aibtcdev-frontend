// hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";


export interface Message {
  role: "user" | "assistant";
  type: "task" | "step" | "result" | null;
  content: string;
  timestamp: Date;
}

export function useChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [followScroll, setFollowScroll] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      if (followScroll) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [followScroll]);

  const handleResetHistory = useCallback(async () => {
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
      setConversationId(null);
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
  }, [authToken, conversationId, toast]);

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
        setConversationId(conversationData.id);

        const detailedConversationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationData.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!detailedConversationResponse.ok) {
          throw new Error(`HTTP error! status: ${detailedConversationResponse.status}`);
        }

        const detailedConversationData = await detailedConversationResponse.json();

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
              role: parsedMsg.role as "user" | "assistant",
              type : parsedMsg.type as "task" | "step" | "result",
              content: parsedMsg.content,
              timestamp: new Date(parsedMsg.timestamp),
            };
          }),
        }));

        const initialMessage: Message = {
          role: "assistant",
          type: null,
          content: "How can I help you today?",
          timestamp: new Date(),
        };
        if (formattedJobs.length > 0) { // Check if there are any messages in the conversation
            setMessages([initialMessage, ...formattedJobs[0].messages]);
        } else {
            setMessages([initialMessage]);
        }
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
  }, [authToken, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthToken(session.access_token);
      }
    };

    getSession();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      type: null, 
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
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

      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${job_id}/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.trim() === "") return;

          const data = JSON.parse(event.data);
          if (!data || typeof data !== "object") return;

          switch (data.type) {
            case "step":
            case "task":
            case "result":
              setMessages((prev) => [
                ...prev,
                { type: data.type, content: data.content , timestamp: data.timestamp},
              ] as Message[]);
              break;
            default:
              console.warn("Unknown message type:", data.type);
          }

          if (data.type === "result") {
            eventSource.close();
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = (error) => {
        if (isLoading) {
          setIsLoading(false);
        } else {
          console.error("EventSource failed:", error);
          toast({
            title: "Connection Failed",
            description: "There was a problem with the connection. Please try again.",
            variant: "destructive",
          });
        }
      };

      eventSource.addEventListener("finish", () => {
        eventSource.close();
        setIsLoading(false);

        const assistantMessage: Message = {
          role: "assistant",
          type: null,
          content: "Task completed",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [authToken, conversationId, input, isLoading, toast]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    handleResetHistory,
    messagesEndRef,
  };
}