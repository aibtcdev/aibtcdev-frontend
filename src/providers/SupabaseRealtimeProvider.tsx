"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface SupabaseRealtimeContextValue {
  // Add any methods you might want to expose later
  isConnected: boolean;
}

const SupabaseRealtimeContext = createContext<SupabaseRealtimeContextValue>({
  isConnected: false,
});

export const useSupabaseRealtime = () => {
  const context = useContext(SupabaseRealtimeContext);
  if (!context) {
    throw new Error(
      "useSupabaseRealtime must be used within SupabaseRealtimeProvider"
    );
  }
  return context;
};

interface SupabaseRealtimeProviderProps {
  children: React.ReactNode;
}

export function SupabaseRealtimeProvider({
  children,
}: SupabaseRealtimeProviderProps) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    const channels: RealtimeChannel[] = [];

    // Proposals table subscription - invalidates all proposal-related queries
    const proposalsChannel = supabase
      .channel("global-proposals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
        },
        (payload) => {
          console.log("Proposals table changed:", payload);

          // Invalidate all proposal queries
          queryClient.invalidateQueries({ queryKey: ["allProposals"] });
          queryClient.invalidateQueries({ queryKey: ["proposals"] });

          // If we have specific proposal data, also invalidate that
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "id" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["proposal", payload.new.id],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "id" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["proposal", payload.old.id],
            });
          }

          // Invalidate DAO-specific proposals if we have dao_id
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "dao_id" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["proposals", payload.new.dao_id],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "dao_id" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["proposals", payload.old.dao_id],
            });
          }
        }
      )
      .subscribe();
    channels.push(proposalsChannel);

    // Votes table subscription - invalidates all vote-related queries
    const votesChannel = supabase
      .channel("global-votes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        (payload) => {
          console.log("Votes table changed:", payload);

          // Invalidate all vote queries
          queryClient.invalidateQueries({ queryKey: ["votes"] });

          // Invalidate proposal-specific votes if we have proposal_id
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "proposal_id" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["proposalVotes", payload.new.proposal_id],
            });
            queryClient.invalidateQueries({
              queryKey: ["proposalVotesTable", payload.new.proposal_id],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "proposal_id" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["proposalVotes", payload.old.proposal_id],
            });
            queryClient.invalidateQueries({
              queryKey: ["proposalVotesTable", payload.old.proposal_id],
            });
          }
        }
      )
      .subscribe();
    channels.push(votesChannel);

    // Chain states table subscription - invalidates chain state queries
    const chainStatesChannel = supabase
      .channel("global-chain-states-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chain_states",
        },
        (payload) => {
          // console.log("Chain states table changed:", payload);

          // Invalidate all chain state queries
          queryClient.invalidateQueries({ queryKey: ["chainStates"] });
          queryClient.invalidateQueries({ queryKey: ["latestChainState"] });

          // Invalidate network-specific chain state if we have network
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "network" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["chainState", payload.new.network],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "network" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["chainState", payload.old.network],
            });
          }
        }
      )
      .subscribe();
    channels.push(chainStatesChannel);

    // DAOs table subscription - invalidates DAO-related queries
    const daosChannel = supabase
      .channel("global-daos-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daos",
        },
        (payload) => {
          console.log("DAOs table changed:", payload);

          // Invalidate all DAO queries
          queryClient.invalidateQueries({ queryKey: ["daos"] });

          // Invalidate specific DAO queries
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "id" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["dao", payload.new.id],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "id" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["dao", payload.old.id],
            });
          }

          // Invalidate DAO by name queries
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "name" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["dao", payload.new.name],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "name" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["dao", payload.old.name],
            });
          }
        }
      )
      .subscribe();
    channels.push(daosChannel);

    // Tokens table subscription - invalidates token-related queries
    const tokensChannel = supabase
      .channel("global-tokens-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
        },
        (payload) => {
          console.log("Tokens table changed:", payload);

          // Invalidate all token queries
          queryClient.invalidateQueries({ queryKey: ["tokens"] });

          // Invalidate specific token queries
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "dao_id" in payload.new
          ) {
            queryClient.invalidateQueries({
              queryKey: ["token", payload.new.dao_id],
            });
          }
          if (
            payload.old &&
            typeof payload.old === "object" &&
            "dao_id" in payload.old
          ) {
            queryClient.invalidateQueries({
              queryKey: ["token", payload.old.dao_id],
            });
          }
        }
      )
      .subscribe();
    channels.push(tokensChannel);

    // Set connected status
    setIsConnected(true);

    // Cleanup function
    return () => {
      console.log("Cleaning up Supabase realtime subscriptions");
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [queryClient]);

  const contextValue: SupabaseRealtimeContextValue = {
    isConnected,
  };

  return (
    <SupabaseRealtimeContext.Provider value={contextValue}>
      {children}
    </SupabaseRealtimeContext.Provider>
  );
}
