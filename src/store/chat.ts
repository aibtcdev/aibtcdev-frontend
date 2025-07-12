import { create } from "zustand";
import { Message } from "@/lib/chat/types";
import { useThreadsStore } from "./threads";
import { getStacksAddress } from "@/lib/address";

// Helper to get storage keys for current user
const getStorageKeys = () => {
  const address = getStacksAddress();
  return {
    activeThreadKey: `${address}_activeThreadId`,
    selectedAgentKey: `${address}_selectedAgentId`,
  };
};

// Global WebSocket instance
let globalWs: WebSocket | null = null;

interface ChatState {
  messages: Record<string, Message[]>;
  fetchedThreads: Set<string>; // Track which threads we've fetched
  activeThreadId: string | null;
  selectedAgentId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  ws: WebSocket | null;
  isTyping: Record<string, boolean>; // Track typing state per thread

  // Connection
  connect: (accessToken: string) => void;
  disconnect: () => void;

  // Messages
  sendMessage: (threadId: string, content: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: (threadId: string) => void;

  // Threads
  setActiveThread: (threadId: string) => void;
  clearActiveThread: () => void;
  getThreadHistory: () => void;

  // Agent
  setSelectedAgent: (agentId: string | null) => void;

  // Status
  setConnectionStatus: (isConnected: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTyping: (threadId: string, isTyping: boolean) => void;
}

// Helper function to get stored thread ID
const getStoredThreadId = (): string | null => {
  if (typeof window === "undefined") return null;
  const { activeThreadKey } = getStorageKeys();
  return localStorage.getItem(activeThreadKey);
};

// Helper function to get stored agent ID
const getStoredAgentId = (): string | null => {
  if (typeof window === "undefined") return null;
  const { selectedAgentKey } = getStorageKeys();
  return localStorage.getItem(selectedAgentKey);
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  fetchedThreads: new Set(),
  activeThreadId: getStoredThreadId(), // Initialize from localStorage
  selectedAgentId: getStoredAgentId(),
  isConnected: false,
  isLoading: false,
  error: null,
  ws: globalWs,
  isTyping: {}, // Initialize empty typing state

  setTyping: (threadId, isTyping) => {
    set((state) => ({
      isTyping: {
        ...state.isTyping,
        [threadId]: isTyping,
      },
    }));
  },

  setSelectedAgent: (agentId) => {
    set({ selectedAgentId: agentId });
  },

  connect: (accessToken: string) => {
    // Don't reconnect if already connected or connecting
    if (
      globalWs &&
      (globalWs.readyState === WebSocket.OPEN ||
        globalWs.readyState === WebSocket.CONNECTING)
    ) {
      // console.log('WebSocket already connected or connecting, skipping connection');
      return;
    }

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/chat/ws";
      if (!wsUrl) {
        throw new Error("WebSocket URL not configured");
      }

      // console.log('Creating new WebSocket connection');
      globalWs = new WebSocket(`${wsUrl}?token=${accessToken}`);

      globalWs.onopen = () => {
        // console.log('WebSocket connected');
        set({ isConnected: true, error: null, ws: globalWs });

        // Fetch thread history for stored thread if it exists
        const storedThreadId = getStoredThreadId();
        if (storedThreadId && !get().fetchedThreads.has(storedThreadId)) {
          get().setActiveThread(storedThreadId);
        }
      };

      globalWs.onclose = () => {
        // console.log('WebSocket disconnected');
        set({ isConnected: false, ws: null });
        globalWs = null;
      };

      globalWs.onerror = (error) => {
        console.error("WebSocket error:", error);
        set({ error: "WebSocket connection error" });
      };

      globalWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('Received message:', data);

          // Set typing to false when receiving any message from the assistant
          if (data.role === "assistant" && data.thread_id) {
            get().setTyping(data.thread_id, false);
          }

          // Handle various message types with appropriate status
          if (data.type === "token") {
            // Token messages should have processing or complete status
            const status =
              data.status ||
              (data.status === "end" ? "complete" : "processing");
            get().addMessage({
              ...data,
              status: status,
            });
          } else if (data.type === "step") {
            // Step messages are part of planning phase
            get().addMessage({
              ...data,
              status: data.status || "planning",
            });
          } else {
            // Handle other message types
            get().addMessage(data);
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };
    } catch (error) {
      console.error("Connection error:", error);
      set({ error: "Failed to connect to WebSocket", isConnected: false });
    }
  },

  disconnect: () => {
    if (
      globalWs?.readyState === WebSocket.OPEN ||
      globalWs?.readyState === WebSocket.CONNECTING
    ) {
      // console.log('Closing WebSocket connection');
      globalWs.close();
      globalWs = null;
      set({ isConnected: false, ws: null });
    }
  },

  clearMessages: (threadId) => {
    // Send delete message through WebSocket
    if (globalWs?.readyState === WebSocket.OPEN) {
      try {
        globalWs.send(
          JSON.stringify({
            type: "delete_thread",
            thread_id: threadId,
          })
        );
      } catch (error) {
        console.error("Failed to send delete thread message:", error);
      }
    }

    // Clear messages and remove thread from local state
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]: [],
      },
      activeThreadId: null,
      fetchedThreads: new Set(
        Array.from(state.fetchedThreads).filter((id) => id !== threadId)
      ),
      isTyping: {
        ...state.isTyping,
        [threadId]: false,
      },
    }));

    // Clear from localStorage
    const { activeThreadKey } = getStorageKeys();
    localStorage.removeItem(activeThreadKey);

    // Remove thread from threads store
    useThreadsStore.getState().removeThread(threadId);
  },

  setActiveThread: (threadId) => {
    set({ activeThreadId: threadId });

    // Store in localStorage
    const { activeThreadKey } = getStorageKeys();
    localStorage.setItem(activeThreadKey, threadId);

    // Only get thread history if we haven't fetched it before
    const state = get();
    if (!state.fetchedThreads.has(threadId)) {
      setTimeout(() => {
        get().getThreadHistory();
        set((state) => ({
          fetchedThreads: new Set(
            Array.from(state.fetchedThreads).concat([threadId])
          ),
        }));
      }, 0);
    }
  },

  clearActiveThread: () => {
    set({ activeThreadId: null });
    const { activeThreadKey } = getStorageKeys();
    localStorage.removeItem(activeThreadKey);
  },

  // Rest of the store implementation remains the same
  addMessage: (message: Message) => {
    set((state) => {
      const messages = state.messages[message.thread_id] || [];
      const lastMessage = messages[messages.length - 1];

      // For token messages, try to append to last message if it's processing
      if (message.type === "token") {
        if (
          lastMessage?.type === "token" &&
          (lastMessage.status === "processing" ||
            lastMessage.status === "planning")
        ) {
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + (message.content || ""),
            status: message.status,
          };
          return {
            messages: {
              ...state.messages,
              [message.thread_id]: updatedMessages,
            },
          };
        }
      }

      return {
        messages: {
          ...state.messages,
          [message.thread_id]: [...messages, message],
        },
      };
    });
  },

  getThreadHistory: () => {
    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
      set({ error: "WebSocket not connected" });
      return;
    }
    try {
      globalWs.send(
        JSON.stringify({
          type: "history",
          role: "user",
          status: "sent",
          thread_id: get().activeThreadId,
          agent_id: get().selectedAgentId,
        })
      );
    } catch (error) {
      set({ error: "Failed to send message" });
      console.error("Send error:", error);
    }
  },

  sendMessage: (threadId, content) => {
    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
      set({ error: "WebSocket not connected" });
      return;
    }

    // Set typing indicator to true when sending a message
    get().setTyping(threadId, true);

    get().addMessage({
      agent_id: get().selectedAgentId,
      thread_id: threadId,
      role: "user",
      content,
      type: "message",
      status: "sent",
    });

    try {
      globalWs.send(
        JSON.stringify({
          type: "message",
          role: "user",
          status: "sent",
          content,
          thread_id: threadId,
          agent_id: get().selectedAgentId,
        })
      );
    } catch (error) {
      set({ error: "Failed to send message" });
      console.error("Send error:", error);
      // Reset typing indicator if message fails
      get().setTyping(threadId, false);
    }
  },

  setConnectionStatus: (isConnected) => set({ isConnected }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
