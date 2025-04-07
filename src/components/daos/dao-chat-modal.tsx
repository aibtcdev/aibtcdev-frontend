"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HistoryIcon, Loader2, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import AgentWalletSelector from "../chat/agent-selector";
import { CreateThreadButton } from "@/components/threads/CreateThreadButton";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { fetchDAOExtensions, fetchToken } from "@/queries/dao-queries";
import type { DAO, Token, Extension } from "@/types/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThreadList from "@/components/threads/thread-list";
import AuthButton from "../home/auth-button";

interface DAOChatModalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DAOChatModal({
  daoId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  token,
}: DAOChatModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Use either controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    isConnected,
    selectedAgentId,
    setSelectedAgent,
    connect,
    activeThreadId,
  } = useChatStore();

  const threadMessages = useMemo(() => {
    return activeThreadId ? messages[activeThreadId] || [] : [];
  }, [activeThreadId, messages]);

  const { accessToken } = useSessionStore();

  const { data: daoExtensions, isLoading: isExtensionsLoading } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000, // 10 minutes
    enabled: open, // Only fetch when modal is open
  });

  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => fetchToken(daoId),
    staleTime: 600000, // 10 minutes
    enabled: open && !token, // Only fetch when modal is open and token is not provided
  });

  const memoizedConnect = useCallback(
    (token: string) => {
      if (!isConnected && token) {
        console.log("Attempting to connect...");
        connect(token);
      }
    },
    [connect, isConnected]
  );

  useEffect(() => {
    if (!accessToken || !open) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        memoizedConnect(accessToken);
      }
    };

    // Initial connection
    memoizedConnect(accessToken);

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accessToken, memoizedConnect, isConnected, open]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      const isMobile = window.innerWidth < 768;
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: isMobile ? "auto" : "smooth", // Use auto for mobile to avoid jank
      });
    }
  }, []);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // If switching to chat tab, scroll to bottom after a short delay
    if (value === "chat" && threadMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
  };

  useEffect(() => {
    if (
      open &&
      threadMessages.length > 0 &&
      (activeTab === "chat" || window.innerWidth >= 768)
    ) {
      // First immediate scroll for positioning
      if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }

      // Then smooth scroll after a delay to ensure content is rendered
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open, threadMessages.length, scrollToBottom, activeTab]);

  // Additional effect to scroll when new messages arrive
  useEffect(() => {
    if (
      open &&
      threadMessages.length > 0 &&
      (activeTab === "chat" || window.innerWidth >= 768)
    ) {
      scrollToBottom();
    }
  }, [threadMessages, open, scrollToBottom, activeTab]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (threadMessages.length > 0 && messageContainerRef.current) {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [threadMessages.length]);

  const renderChatSection = () => {
    if (!accessToken) {
      return (
        <div className="flex items-center justify-center h-full flex-col">
          Please Connect your wallet to start participating
          <AuthButton />
        </div>
      );
    }

    if (!activeThreadId) {
      return (
        <div className="flex items-center justify-center h-full backdrop-blur-sm">
          <div className="text-center space-y-4 p-4 -mt-20">
            <div className="flex justify-center gap-3">
              <CreateThreadButton />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 shadow-md bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex"
            >
              <HistoryIcon className="h-5 w-5" />
            </Button>
            <div>
              <AgentWalletSelector
                selectedAgentId={selectedAgentId}
                onSelect={setSelectedAgent}
                disabled={isChatLoading || !isConnected}
              />
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <CreateThreadButton />
          </div>
        </div>

        {/* Middle scrollable area - takes remaining space */}
        <div className="flex-1 overflow-auto" ref={messageContainerRef}>
          <div className="p-4">
            {chatError && (
              <Alert variant="destructive" className="my-2">
                <AlertDescription>{chatError}</AlertDescription>
              </Alert>
            )}
            <MessageList messages={threadMessages} />
          </div>
        </div>

        {/* Footer - fixed height */}
        <div className="sticky bottom-0 w-full min-w-0 pb-safe shadow-lg z-20">
          <ChatInput
            selectedAgentId={selectedAgentId}
            onAgentSelect={setSelectedAgent}
            disabled={isChatLoading || !isConnected}
            value={inputValue}
            onChange={setInputValue}
          />
        </div>
      </div>
    );
  };

  // Get token symbol
  const tokenName = tokenData?.symbol || "DAO";

  // Updated structured prompts
  const STRUCTURED_PROMPTS = [
    {
      step: 1,
      title: "Check your wallet balance for STX and sBTC",
      prompt: `Check my wallet balance for STX and sBTC.`,
      description:
        "View your current wallet balances to ensure you have necessary tokens.",
    },
    {
      step: 2,
      title: "Get STX from the testnet faucet (testnet only)",
      prompt: `Fund my wallet with STX from the testnet faucet.`,
      description:
        "Request STX tokens from the Stacks testnet faucet for testing.",
    },
    {
      step: 3,
      title: "Get sBTC from Faktory testnet faucet (testnet only)",
      prompt: `Request testnet sBTC from the Faktory faucet.`,
      description:
        "Request sBTC tokens from the Faktory testnet faucet for testing.",
    },
    {
      step: 4,
      title: "Buy DAO tokens to participate",
      prompt: (extensions: Extension[]) => {
        const extensionsList = extensions
          .map((ext) => `${ext.type}: ${ext.contract_principal}`)
          .join("\n");

        return `Buy some ${tokenName} tokens so I can participate in the DAO.\n\n${extensionsList}`;
      },
      description:
        "Purchase DAO tokens to gain voting rights and participate in governance.",
      extensionTypes: ["TOKEN_DAO", "TOKEN_DEX"],
    },
    {
      step: 5,
      title: "Create an action proposal",
      prompt: (extensions: Extension[]) => {
        const extensionsList = extensions
          .map((ext) => `${ext.type}: ${ext.contract_principal}`)
          .join("\n");

        return `Create an action proposal to send a message to all DAO members about our progress.\n\n${extensionsList}`;
      },
      description: "Submit a new action proposal to the DAO for voting.",
      extensionTypes: [
        "EXTENSIONS_ACTION_PROPOSALS",
        "ACTIONS_MESSAGING_SEND_MESSAGE",
        "TOKEN_DAO",
      ],
    },
    {
      step: 6,
      title: "Check proposal information using ID",
      prompt: (extensions: Extension[]) => {
        const extensionsList = extensions
          .map((ext) => `${ext.type}: ${ext.contract_principal}`)
          .join("\n");

        return `Check proposal information for proposal 11.\n\n${extensionsList}`;
      },
      description:
        "View detailed information about a specific proposal using its ID.",
      extensionTypes: ["EXTENSIONS_ACTION_PROPOSALS"],
    },
    {
      step: 7,
      title: "Cast a vote on a proposal",
      prompt: (extensions: Extension[]) => {
        const extensionsList = extensions
          .map((ext) => `${ext.type}: ${ext.contract_principal}`)
          .join("\n");

        return `Cast a 'yes' vote on proposal 11.\n\n${extensionsList}`;
      },
      description: "Vote on an active proposal to approve or reject it.",
      extensionTypes: ["EXTENSIONS_ACTION_PROPOSALS"],
    },
    {
      step: 8,
      title: "Conclude a proposal",
      prompt: (extensions: Extension[]) => {
        const extensionsList = extensions
          .map((ext) => `${ext.type}: ${ext.contract_principal}`)
          .join("\n");

        return `Conclude proposal ID #42 now that voting has ended.\n\n${extensionsList}`;
      },
      description:
        "Finalize a proposal after the voting period to execute its actions if approved.",
      extensionTypes: [
        "EXTENSIONS_ACTION_PROPOSALS",
        "ACTIONS_MESSAGING_SEND_MESSAGE",
        "ACTIONS_TREASURY_ALLOW_ASSET",
      ],
    },
  ];

  const handlePromptClick = (promptText: string) => {
    setInputValue(promptText);
    // Switch to chat tab after selecting a prompt on mobile
    if (window.innerWidth < 768) {
      setActiveTab("chat");
      // Schedule scroll after tab switch
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
  };

  const renderPromptsSection = () => {
    if (isExtensionsLoading || isTokenLoading) {
      return (
        <div className="flex justify-center items-center h-full w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 shadow-md bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">
              Step-by-Step Guide to Interact with {tokenName} DAO
            </h2>
          </div>
        </div>

        {/* Middle scrollable area - takes remaining space */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            <span>simply click the prompt for quick message</span>
            {STRUCTURED_PROMPTS.map((promptItem) => {
              // For prompts that require extensions
              let promptText = "";

              if (
                typeof promptItem.prompt === "function" &&
                promptItem.extensionTypes
              ) {
                // Find all relevant extensions for this prompt
                const relevantExtensions =
                  daoExtensions?.filter((ext) =>
                    promptItem.extensionTypes?.includes(ext.type)
                  ) || [];

                // If we have matching extensions, generate the prompt with all of them
                if (relevantExtensions.length > 0) {
                  promptText = promptItem.prompt(relevantExtensions);
                } else {
                  // Fallback if no matching extensions found
                  promptText = `${promptItem.title}\n(No matching extensions found)`;
                }
              } else {
                // For static prompts
                promptText =
                  typeof promptItem.prompt === "string"
                    ? promptItem.prompt
                    : "";
              }

              return (
                <button
                  key={promptItem.step}
                  onClick={() => handlePromptClick(promptText)}
                  className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border relative group w-full text-left hover:bg-background/80 transition-colors hover:bg-zinc-800"
                >
                  <div className="flex items-center mb-2">
                    <span className="flex items-center justify-center bg-primary/10 text-primary rounded-full w-6 h-6 text-sm font-medium mr-2">
                      {promptItem.step}
                    </span>
                    <h3 className="font-medium">{promptItem.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {promptItem.description}
                  </p>

                  <div className="bg-muted/50 p-2 rounded-md text-sm">
                    <div className="whitespace-pre-line">{promptText}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] p-0 rounded-lg">
        <DialogTitle className="sr-only">
          {tokenName} DAO Chat and Interaction Examples
        </DialogTitle>
        <DialogDescription className="sr-only">
          Chat with your agent and see examples of how to interact with your
          {tokenName} DAO&apos;s extensions
        </DialogDescription>
        <div className="h-full overflow-hidden">
          {/* ThreadList Sidebar */}
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

          {/* Mobile view */}
          <div className="md:hidden h-full">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="h-full flex flex-col"
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="prompts">Guide</TabsTrigger>
              </TabsList>
              <TabsContent
                value="chat"
                className="flex-1 overflow-hidden h-[calc(90vh-48px)]"
              >
                {renderChatSection()}
              </TabsContent>
              <TabsContent
                value="prompts"
                className="flex-1 overflow-hidden h-[calc(90vh-48px)]"
              >
                {renderPromptsSection()}
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop view */}
          <div
            className={`hidden md:grid md:grid-cols-${
              isSidebarOpen ? "1" : "2"
            } h-full transition-all duration-300`}
          >
            {/* Chat Section - Left Side */}
            <div
              className={`h-full border-r flex flex-col overflow-auto ${
                isSidebarOpen ? "ml-64" : ""
              } transition-all duration-300`}
            >
              {renderChatSection()}
            </div>

            {/* Prompts Section - Right Side */}
            {!isSidebarOpen && (
              <div className="h-full flex flex-col overflow-auto">
                {renderPromptsSection()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
