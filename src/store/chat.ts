import { create } from "zustand";
import { Message } from '@/lib/chat/types';
import { useThreadsStore } from "./threads";
import { getStacksAddress } from "@/lib/address";


// Local storage key for active thread
const address = getStacksAddress()
const ACTIVE_THREAD_KEY = `${address}_activeThreadId`;

// Global WebSocket instance
let globalWs: WebSocket | null = null;

interface ChatState {
  messages: Record<string, Message[]>;
  fetchedThreads: Set<string>;  // Track which threads we've fetched
  activeThreadId: string | null;
  selectedAgentId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  ws: WebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
  heartbeatInterval: NodeJS.Timeout | null;

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
}

// Helper function to get stored thread ID
const getStoredThreadId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_THREAD_KEY);
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  fetchedThreads: new Set(),
  activeThreadId: getStoredThreadId(), // Initialize from localStorage
  selectedAgentId: null,
  isConnected: false,
  isLoading: false,
  error: null,
  ws: globalWs,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectTimeout: null,
  heartbeatInterval: null,

  setSelectedAgent: (agentId) => {
    set({ selectedAgentId: agentId });
  },

  connect: (accessToken: string) => {
    const state = get();
    // Clear any existing reconnection attempts
    if (state.reconnectTimeout) {
      clearTimeout(state.reconnectTimeout);
    }

    // Don't reconnect if already connected or connecting
    if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/chat/ws"
      if (!wsUrl) {
        throw new Error("WebSocket URL not configured");
      }

      globalWs = new WebSocket(`${wsUrl}?token=${accessToken}`);

      globalWs.onopen = () => {
        // Set up heartbeat
        const heartbeat = setInterval(() => {
          if (globalWs?.readyState === WebSocket.OPEN) {
            globalWs.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);

        set({ 
          isConnected: true, 
          error: null, 
          ws: globalWs,
          reconnectAttempts: 0,
          heartbeatInterval: heartbeat
        });

        // Fetch thread history for stored thread if it exists
        const storedThreadId = getStoredThreadId();
        if (storedThreadId && !get().fetchedThreads.has(storedThreadId)) {
          get().setActiveThread(storedThreadId);
        }
      };

      globalWs.onclose = () => {
        const state = get();
        set({ isConnected: false, ws: null });
        globalWs = null;

        // Implement exponential backoff for reconnection
        if (state.reconnectAttempts < state.maxReconnectAttempts) {
          const timeout = setTimeout(() => {
            set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
            get().connect(accessToken);
          }, Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000));
          
          set({ reconnectTimeout: timeout });
        }
      };

      globalWs.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ error: "WebSocket connection error" });
      };

      globalWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('Received message:', data);
          if (data.type === "token") {
            get().addMessage(data);
          } else {
            get().addMessage(data);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };
    } catch (error) {
      console.error('Connection error:', error);
      set({ error: "Failed to connect to WebSocket", isConnected: false });
    }
  },

  disconnect: () => {
    const state = get();
    // Clear any pending reconnection attempts
    if (state.reconnectTimeout) {
      clearTimeout(state.reconnectTimeout);
    }
    // Clear heartbeat interval
    if (state.heartbeatInterval) {
      clearInterval(state.heartbeatInterval);
    }

    if (globalWs?.readyState === WebSocket.OPEN || globalWs?.readyState === WebSocket.CONNECTING) {
      globalWs.close();
      globalWs = null;
      set({ 
        isConnected: false, 
        ws: null, 
        reconnectAttempts: 0,
        reconnectTimeout: null,
        heartbeatInterval: null
      });
    }
  },

  clearMessages: (threadId) => {
    // Send delete message through WebSocket
    if (globalWs?.readyState === WebSocket.OPEN) {
      try {
        globalWs.send(JSON.stringify({
          type: "delete_thread",
          thread_id: threadId,
        }));
      } catch (error) {
        console.error("Failed to send delete thread message:", error);
      }
    }

    // Clear messages and remove thread from local state
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]: []
      },
      activeThreadId: null,
      fetchedThreads: new Set(Array.from(state.fetchedThreads).filter(id => id !== threadId))
    }));

    // Clear from localStorage
    localStorage.removeItem(ACTIVE_THREAD_KEY);

    // Remove thread from threads store
    useThreadsStore.getState().removeThread(threadId);
  },

  setActiveThread: (threadId) => {
    set({ activeThreadId: threadId });

    // Store in localStorage
    localStorage.setItem(ACTIVE_THREAD_KEY, threadId);

    // Only get thread history if we haven't fetched it before
    const state = get();
    if (!state.fetchedThreads.has(threadId)) {
      setTimeout(() => {
        get().getThreadHistory();
        set(state => ({
          fetchedThreads: new Set(Array.from(state.fetchedThreads).concat([threadId]))
        }));
      }, 0);
    }
  },

  clearActiveThread: () => {
    set({ activeThreadId: null });
    localStorage.removeItem(ACTIVE_THREAD_KEY);
  },

  // Rest of the store implementation remains the same
  addMessage: (message: Message) => {
    set((state) => {
      const messages = state.messages[message.thread_id] || [];
      const lastMessage = messages[messages.length - 1];

      // For token messages, try to append to last message if it's processing
      if (message.type === 'token') {
        if (lastMessage?.type === 'token' && lastMessage.status === 'processing') {
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + (message.content || ''),
            status: message.status
          };
          return {
            messages: {
              ...state.messages,
              [message.thread_id]: updatedMessages
            }
          };
        }
      }

      return {
        messages: {
          ...state.messages,
          [message.thread_id]: [...messages, message]
        }
      };
    });
  },

  getThreadHistory: () => {
    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
      set({ error: "WebSocket not connected" });
      return;
    }
    try {
      globalWs.send(JSON.stringify({
        type: "history",
        role: "user",
        status: "sent",
        thread_id: get().activeThreadId,
        agent_id: get().selectedAgentId
      }));
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

    get().addMessage({
      agent_id: get().selectedAgentId,
      thread_id: threadId,
      role: "user",
      content,
      type: "message",
      status: "sent"
    });

    try {
      globalWs.send(JSON.stringify({
        type: "message",
        role: "user",
        status: "sent",
        content,
        thread_id: threadId,
        agent_id: get().selectedAgentId
      }));
    } catch (error) {
      set({ error: "Failed to send message" });
      console.error("Send error:", error);
    }
  },

  setConnectionStatus: (isConnected) => set({ isConnected }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
