import { create } from "zustand";
import { Thread } from "@/lib/chat/types";
import { supabase } from "@/utils/supabase/client";

interface ThreadsState {
  threads: Thread[];
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  editedTitle: string;

  // Actions
  setThreads: (threads: Thread[]) => void;
  addThread: (thread: Thread) => void;
  removeThread: (threadId: string) => void;
  updateThread: (threadId: string, update: Partial<Thread>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchThreads: (userId: string) => Promise<void>;

  // Thread editing actions
  startEditing: (threadId: string) => void;
  cancelEditing: () => void;
  setEditedTitle: (title: string) => void;
  saveEdit: (threadId: string) => Promise<void>;
}

export const useThreadsStore = create<ThreadsState>((set, get) => ({
  threads: [],
  isLoading: false,
  error: null,
  isEditing: false,
  editedTitle: "",

  fetchThreads: async (profileId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data: threads, error } = await supabase
        .from("threads")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({ threads: threads || [], isLoading: false });
    } catch (error) {
      console.error("Error fetching threads:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch threads",
        isLoading: false,
      });
    }
  },

  setThreads: (threads) => set({ threads }),

  addThread: (thread) =>
    set((state) => ({
      threads: [thread, ...state.threads], // Add new thread at the beginning
    })),

  removeThread: (threadId) =>
    set((state) => ({
      threads: state.threads.filter((thread) => thread.id !== threadId),
    })),

  updateThread: async (threadId, update) => {
    try {
      const { data, error } = await supabase
        .from("threads")
        .update(update)
        .eq("id", threadId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        threads: state.threads.map((thread) =>
          thread.id === threadId ? { ...thread, ...data } : thread
        ),
      }));
    } catch (error) {
      console.error("Error updating thread:", error);
      throw error;
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Thread editing actions
  startEditing: (threadId: string) => {
    const thread = get().threads.find((t) => t.id === threadId);
    if (thread) {
      set({ isEditing: true, editedTitle: thread.title || "" });
    }
  },

  cancelEditing: () => set({ isEditing: false, editedTitle: "" }),

  setEditedTitle: (title: string) => set({ editedTitle: title }),

  saveEdit: async (threadId: string) => {
    const { editedTitle } = get();
    try {
      await get().updateThread(threadId, { title: editedTitle });
      set({ isEditing: false, editedTitle: "" });
    } catch (error) {
      console.error("Failed to update thread title:", error);
      throw error;
    }
  },
}));
