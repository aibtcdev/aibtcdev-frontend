// AUTO SELECT THE AGENT ID AND THREAD ID AS SOON AS USER LOGS IN SO THAT THEY DON'T HAVE TO OPEN UP THE MODAL TO SEND MESSAGE

import { getStacksAddress } from "@/lib/address";
import { fetchAgents } from "@/services/agent.service";
import { useChatStore } from "@/store/chat";
import { useThreadsStore } from "@/store/threads";
import { supabase } from "@/utils/supabase/client";

/**
 * Automatically initializes the user's agent and thread selection on login
 * This ensures users don't have to manually select an agent and thread to start chatting
 * @param userId - The authenticated user's ID
 */
export async function runAutoInit(userId: string) {
  // Get the Stacks address first and ensure it's not null
  const address = getStacksAddress();
  if (!address) {
    console.error("Stacks address is null or undefined");
    return;
  }

  const chatStore = useChatStore.getState();
  const threadsStore = useThreadsStore.getState();

  let agentId = chatStore.selectedAgentId;

  // 1. Try localStorage first
  const storedAgentId = localStorage.getItem(`${address}_selectedAgentId`);
  if (storedAgentId) {
    agentId = storedAgentId;
    chatStore.setSelectedAgent(agentId);
  }

  // 2. Fallback to DAO Manager
  if (!agentId) {
    const agents = await fetchAgents();
    const daoManager = agents.find((a) => a.profile_id === userId);

    if (daoManager) {
      agentId = daoManager.id;
      chatStore.setSelectedAgent(agentId);
      localStorage.setItem(`${address}_selectedAgentId`, daoManager.id);
    }
  }

  // 3. Thread check
  if (agentId) {
    const { data: threads, error } = await supabase
      .from("threads")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching threads:", error);
      return;
    }

    if (threads.length > 0) {
      // Store the active thread ID with the address prefix
      chatStore.setActiveThread(threads[0].id);
      localStorage.setItem(`${address}_activeThreadId`, threads[0].id);
      threadsStore.addThread(threads[0]);
    } else {
      const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert([
          {
            profile_id: userId,
            title: "New Chat",
          },
        ])
        .select()
        .single();

      if (threadError || !newThread) {
        console.error("Error creating thread:", threadError);
        return;
      }

      threadsStore.addThread(newThread);
      chatStore.setActiveThread(newThread.id);
      // Store the active thread ID with the address prefix
      localStorage.setItem(`${address}_activeThreadId`, newThread.id);
    }
  }
}
