"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { getTool } from "@/lib/tools";
import { CloneAgent, CloneTask } from "@/types/supabase";

const getDefaultAgents = async (): Promise<CloneAgent[]> => {
  // must match tool name in backend for specific tools
  const alexPriceHistory = await getTool("alex_get_price_history");
  const alexGetTokenPoolVolume = await getTool("alex_get_token_pool_volume");
  const bitflowExecuteTrade = await getTool("bitflow_execute_trade");

  // can also get all tools in category, e.g.
  // const bitflowTools = await getToolsByCategory("bitflow");

  return [
    {
      name: "Alexia",
      role: "Market Data Researcher",
      goal: "Analyze and provide insights on market trends using ALEX data from your available tools to help inform future decisions.",
      backstory:
        "An extremely knowledgeable expert on all things ALEX: the DeFi protocol on Stacks, a Bitcoin L2. Specialized in processing and analyzing ALEX market data to identify trading opportunities and market patterns.",
      agent_tools: [alexPriceHistory.id, alexGetTokenPoolVolume.id],
    },
    {
      name: "Bert",
      role: "Bitflow Trade Executor",
      goal: "Execute a trade based on information gathered by other agents and tools.",
      backstory:
        "An experienced trainer on Stacks, a Bitcoin L2, who leverages Bitflow for seamless aggregation of trades across several DEXs in the eocsystem. Experienced in implementing trading strategies and managing trade execution using the available tools.",
      agent_tools: [bitflowExecuteTrade.id],
    },
  ];
};

const createTaskForAgent = (agent: CloneAgent): CloneTask => {
  const taskMap: { [key: string]: CloneTask } = {
    Alexia: {
      description:
        "Analyze available data from ALEX and provide insights on market trends related to the user's input.",
      expected_output:
        "Report on market trends, potential entry/exit points, and risk analysis.",
    },
    Bert: {
      description:
        "Execute trades if requested based on confirmed signals and risk parameters.",
      expected_output:
        "Trade execution reports, position management updates, and performance metrics. Always include the txid returned after making a transaction.",
    },
  };

  return (
    taskMap[agent.name] || {
      description: "Default task description",
      expected_output: "Default expected output",
    }
  );
};

interface CloneTradingAnalyzerProps {
  onCloneComplete: () => void;
}

export function CloneTradingAnalyzer({
  onCloneComplete,
}: CloneTradingAnalyzerProps) {
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCloned, setHasCloned] = useState(false);
  const [agents, setAgents] = useState<CloneAgent[]>([]);

  useEffect(() => {
    const init = async () => {
      await checkIfAlreadyCloned();
      const defaultAgents = await getDefaultAgents();
      setAgents(defaultAgents);
    };
    init();
  }, []);

  const checkIfAlreadyCloned = async () => {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return;

      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .eq("profile_id", profile.user.id)
        .eq("name", "Trading Analyzer");

      if (error) {
        console.error("Error checking for existing TradingAnalyzer:", error);
        return;
      }

      setHasCloned(data && data.length > 0);
    } catch (err) {
      console.error("Error in checkIfAlreadyCloned:", err);
    }
  };

  const createTradingAnalyzer = async () => {
    if (hasCloned) {
      setError("Trading Analyzer has already been cloned.");
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) {
        throw new Error("No authenticated user found");
      }

      // Create crew
      const { data: crew, error: crewError } = await supabase
        .from("crews")
        .insert({
          name: "Trading Analyzer",
          description: "Analyze and trade with our starter crew!",
          profile_id: profile.user.id,
        })
        .select()
        .single();

      if (crewError || !crew) {
        throw new Error("Failed to create crew");
      }

      console.log("Creating agents for crew:", crew.id);
      // Create agents and their tasks
      for (const agent of agents) {
        console.log("Creating agent:", agent.name);
        const { data: createdAgent, error: agentError } = await supabase
          .from("agents")
          .insert({
            name: agent.name,
            role: agent.role,
            goal: agent.goal,
            backstory: agent.backstory,
            agent_tools: agent.agent_tools,
            crew_id: crew.id,
            profile_id: profile.user.id,
          })
          .select()
          .single();

        if (agentError || !createdAgent) {
          const error = `Error creating agent ${agent.name}: ${agentError?.message}`;
          console.error(error);
          throw new Error(error);
        }

        // Create task for agent
        const task = createTaskForAgent(agent);
        const { error: taskError } = await supabase.from("tasks").insert({
          description: task.description,
          expected_output: task.expected_output,
          agent_id: createdAgent.id,
          crew_id: crew.id,
          profile_id: profile.user.id,
        });

        if (taskError) {
          console.error("Error creating task:", taskError);
        }
      }

      setHasCloned(true);
      onCloneComplete();
      toast({
        title: "Success",
        description:
          "You've successfully cloned the Trading Analyzer. You can find it in your crews list.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={createTradingAnalyzer}
        disabled={isCloning || hasCloned}
        variant="outline"
        className="w-full"
      >
        {isCloning ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            <span>Cloning Trading Analyzer...</span>
          </div>
        ) : hasCloned ? (
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Trading Analyzer Cloned</span>
          </div>
        ) : (
          "Clone Trading Analyzer"
        )}
      </Button>
    </div>
  );
}
