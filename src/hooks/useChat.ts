import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import * as Sentry from "@sentry/nextjs";

export interface Message {
  role: "user" | "assistant";
  type: "task" | "step" | "result" | null;
  content: string;
  timestamp: Date;
  tool?: string;
  tool_input?: string;
  result?: string;
}

export function useChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentJobRef = useRef<{
    steps: Message[];
    tasks: Message[];
    results: Message[];
  }>({
    steps: [],
    tasks: [],
    results: [],
  });

  const scrollToBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const handleResetHistory = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true); // Set loading state during reset

      // Close existing WebSocket connection if any
      if (ws) {
        // Create a promise that resolves when the WebSocket is closed
        await new Promise<void>((resolve) => {
          const closeHandler = () => {
            console.log("WebSocket closed during reset");
            resolve();
          };

          if (ws.readyState === WebSocket.CLOSED) {
            resolve();
          } else {
            ws.addEventListener('close', closeHandler, { once: true });
            ws.close();
          }
        });
        setWs(null);
      }

      // Delete current conversation
      const deleteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(`HTTP error! status: ${deleteResponse.status}`);
      }

      // Create a new conversation
      const newConversationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!newConversationResponse.ok) {
        throw new Error(`HTTP error! status: ${newConversationResponse.status}`);
      }

      const newConversation = await newConversationResponse.json();

      // Reset current job state
      currentJobRef.current = {
        steps: [],
        tasks: [],
        results: [],
      };

      // Reset messages and set new conversation ID
      const initialMessage: Message = {
        role: "assistant",
        type: null,
        content: "Welcome back! Let's see what your ai can pull off today.",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      setConversationId(newConversation.id);

      // Note: loading state will be reset when new WebSocket connects in the useEffect

    } catch (error) {
      console.error("Error resetting history:", error);
      Sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to reset chat history",
        variant: "destructive",
      });
      setIsLoading(false); // Reset loading state on error
    }
  }, [authToken, conversationId, ws, toast]);

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

        const initialMessage: Message = {
          role: "assistant",
          type: null,
          content: "Welcome back! Let's see what your ai can pull off today.",
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        Sentry.captureException(error);
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setAuthToken(session.access_token);
      }
    };

    getSession();
  }, []);

  useEffect(() => {
    if (!conversationId || !authToken) return;

    const wsUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/chat/conversation/${conversationId}/ws`);
    wsUrl.searchParams.append('token', authToken);

    const newWs = new WebSocket(wsUrl.toString());

    newWs.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setIsLoading(false);
    };

    newWs.onmessage = (event) => {
      try {
        if (!event.data || event.data.trim() === "") return;

        const data = JSON.parse(event.data);
        if (!data || typeof data !== "object") return;

        switch (data.type) {
          case 'history':
            console.log('Raw history data:', data);
            // Set initial conversation history
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            const historyMessages = data.messages.map((msg: any) => {
              console.log('Processing history message:', msg);
              // Ensure timestamp is properly parsed from the message
              const timestamp = msg.timestamp || msg.created_at || msg.job_started_at || new Date().toISOString();
              // Skip step messages with empty thoughts
              if (msg.type === "step" && (!msg.thought || msg.thought.trim() === "")) {
                return null;
              }
              const processedMsg = {
                role: msg.role,
                type: msg.type,
                content: msg.type === "step" ? msg.thought : msg.content,
                timestamp: new Date(timestamp),
                tool: msg.tool,
                tool_input: msg.tool_input,
                result: msg.result,
              };
              console.log('Processed message:', processedMsg);
              return processedMsg;
            })
            .filter((msg: Message | null): msg is Message => msg !== null && msg.type !== "task");
            console.log('Final history messages:', historyMessages);
            // Sort messages by timestamp
            historyMessages.sort((a: { timestamp: { getTime: () => number; }; }, b: { timestamp: { getTime: () => number; }; }) => a.timestamp.getTime() - b.timestamp.getTime());
            setMessages(historyMessages);
            break;

          case 'job_started':
            console.log('New job started:', data.job_id);
            // Reset the current job's message groups when a new job starts
            currentJobRef.current = {
              steps: [],
              tasks: [],
              results: [],
            };
            break;

          case 'stream':
            // Skip step messages with empty thoughts
            if (data.stream_type === "step" && (!data.thought || data.thought.trim() === "")) {
              break;
            }
            const newMessage: Message = {
              role: "assistant",
              type: data.stream_type,
              content: data.stream_type === "step" ? data.thought : data.content,
              timestamp: new Date(data.timestamp),
              tool: data.tool,
              tool_input: data.tool_input,
              result: data.result,
            };

            switch (data.stream_type) {
              case "step":
                currentJobRef.current.steps.push(newMessage);
                break;
              case "task":
                // Skip storing task messages
                break;
              case "result":
                currentJobRef.current.results.push(newMessage);
                setIsLoading(false);
                break;
              default:
                console.warn("Unknown stream type:", data.stream_type);
            }

            // Update messages with all current groups
            setMessages((prev) => {
              const withoutCurrentJob = prev.filter(
                (msg) =>
                  msg.role !== "assistant" ||
                  !msg.type ||
                  msg.timestamp < new Date(data.job_started_at)
              );

              return [
                ...withoutCurrentJob,
                ...currentJobRef.current.steps,
                ...currentJobRef.current.results,
              ];
            });
            break;

          case 'user_message':
            // Add user message from history
            const userMessage: Message = {
              role: "user",
              type: null,
              content: data.content,
              timestamp: new Date(data.timestamp),
            };
            setMessages(prev => [...prev, userMessage]);
            break;

          case 'error':
            console.error('Error from WebSocket:', data.message);
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
            });
            setIsLoading(false);
            break;

          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        Sentry.captureException(error);
      }
    };

    newWs.onerror = (error) => {
      console.error("WebSocket error:", error);
      Sentry.captureException(error);
      toast({
        title: "Error",
        description: "Connection error occurred",
        variant: "destructive",
      });
    };

    newWs.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setWs(null);
    };

    setWs(newWs);

    return () => {
      if (newWs.readyState === WebSocket.OPEN) {
        newWs.close();
      }
    };
  }, [conversationId, authToken, toast]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading || !ws || ws.readyState !== WebSocket.OPEN) return;

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
        ws.send(JSON.stringify({
          type: 'chat_message',
          message: input
        }));
      } catch (error) {
        console.error("Error sending message:", error);
        Sentry.captureException(error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    },
    [input, isLoading, ws, toast]
  );

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    handleResetHistory,
    messagesEndRef,
    isConnected,
  };
}
