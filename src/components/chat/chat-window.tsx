"use client";

import { useEffect, useCallback, useState } from "react";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import AgentWalletSelector from "./agent-selector";
import { CreateThreadButton } from "../threads/CreateThreadButton";
import ThreadList from "../threads/thread-list";

export function ChatWindow() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    isConnected,
    selectedAgentId,
    setSelectedAgent,
    connect,
    disconnect,
    activeThreadId,
  } = useChatStore();

  const { accessToken } = useSessionStore();
  const threadMessages = activeThreadId ? messages[activeThreadId] || [] : [];

  const memoizedConnect = useCallback(
    (token: string) => {
      console.log("Attempting to connect...");
      connect(token);
    },
    [connect]
  );

  const memoizedDisconnect = useCallback(() => {
    console.log("Disconnecting...");
    disconnect();
  }, [disconnect]);

  useEffect(() => {
    if (!accessToken) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        memoizedConnect(accessToken);
      }
    };

    // Initial connection
    memoizedConnect(accessToken);
    
    // Visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      memoizedDisconnect();
    };
  }, [accessToken, memoizedConnect, memoizedDisconnect, isConnected]);

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert>
          <AlertDescription>Please sign in to start chatting</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!activeThreadId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] backdrop-blur-sm">
        <div className="text-center space-y-4 p-4 sm:p-6 lg:p-8 -mt-20">
          <div className="flex justify-center gap-3">
            <CreateThreadButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[94dvh] md:h-[100dvh] w-full">
      {/* Fixed Sidebar */}
      <div
        className={`
        hidden md:block fixed left-0 top-15 h-full
        ${isSidebarOpen ? "w-64" : "w-0"}
        transition-all duration-300 ease-in-out
        border-r border-zinc-800
        overflow-hidden
        bg-background
        z-30
      `}
      >
        <ThreadList />
      </div>

      {/* Main Chat Area with margin for sidebar */}
      <div
        className={`
        flex flex-col relative flex-1 min-w-0 max-w-full
        ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}
        transition-all duration-300 ease-in-out
      `}
      >
        {/* Header with shadow */}
        <div className="sticky top-0 flex items-center justify-between px-2 md:px-4 h-14 min-w-0 backdrop-blur-sm w-full shadow-lg z-20">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
            {/* Sidebar Toggle - Only visible on desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div>
                <AgentWalletSelector
                  selectedAgentId={selectedAgentId}
                  onSelect={setSelectedAgent}
                  disabled={isChatLoading || !isConnected}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <CreateThreadButton />
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-hidden w-full min-w-0 max-w-full">
          <ScrollArea className="h-full w-full pb-4">
            <div className="flex flex-col justify-end min-h-full w-full max-w-full">
              {chatError && (
                <Alert
                  variant="destructive"
                  className="mx-2 md:mx-4 my-2 md:my-4"
                >
                  <AlertDescription>{chatError}</AlertDescription>
                </Alert>
              )}
              <MessageList messages={threadMessages} />
            </div>
          </ScrollArea>
        </div>

        {/* Input with shadow */}
        <div className="sticky bottom-0 w-full min-w-0 pb-safe shadow-lg z-20">
          <div className="px-2 md:px-4">
            <div className="relative">
              <ChatInput
                selectedAgentId={selectedAgentId}
                onAgentSelect={setSelectedAgent}
                disabled={isChatLoading || !isConnected}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
