"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

interface Agent {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  agent_tools: string[];
}

interface Task {
  description: string;
  expected_output: string;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    name: "Research agent for ALEX",
    role: "Market Researcher",
    goal: "Analyze and provide insights on market trends using ALEX data",
    backstory:
      "Specialized in processing and analyzing ALEX market data to identify trading opportunities and market patterns",
    agent_tools: ["alex_tools"],
  },
  {
    name: "Research agent for bitflow",
    role: "Bitflow Analyst",
    goal: "Monitor and analyze Bitflow trading signals and market data",
    backstory:
      "Expert in interpreting Bitflow signals and correlating them with market movements",
    agent_tools: ["bitflow_tools"],
  },
  {
    name: "Research agent for lunarcrush",
    role: "Social Sentiment Analyst",
    goal: "Track and analyze social sentiment data from LunarCrush",
    backstory:
      "Specialized in social media sentiment analysis and its correlation with crypto markets",
    agent_tools: ["lunarcrush_tools"],
  },
  {
    name: "Trade executor for bitflow",
    role: "Trade Executor",
    goal: "Execute trades based on analyzed signals and market conditions",
    backstory:
      "Experienced in implementing trading strategies and managing trade execution",
    agent_tools: ["trade_executor"],
  },
];

const createTaskForAgent = (agent: Agent): Task => {
  const taskMap: { [key: string]: Task } = {
    "Research agent for ALEX": {
      description:
        "Monitor and analyze ALEX market data for trading opportunities",
      expected_output:
        "Daily report on market trends, potential entry/exit points, and risk analysis",
    },
    "Research agent for bitflow": {
      description:
        "Analyze Bitflow signals and identify high-probability trading setups",
      expected_output:
        "Hourly updates on signal strength, trade recommendations, and risk assessment",
    },
    "Research agent for lunarcrush": {
      description:
        "Track social sentiment metrics and their correlation with market movements",
      expected_output:
        "Real-time updates on social sentiment shifts and their market implications",
    },
    "Trade executor for bitflow": {
      description:
        "Execute trades based on confirmed signals and risk parameters",
      expected_output:
        "Trade execution reports, position management updates, and performance metrics",
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

  useEffect(() => {
    checkIfAlreadyCloned();
  }, []);

  const checkIfAlreadyCloned = async () => {
    const { data: profile } = await supabase.auth.getUser();
    if (!profile.user) return;

    const { data, error } = await supabase
      .from("crews")
      .select("id")
      .eq("profile_id", profile.user.id)
      .eq("name", "TradingAnalyzer")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking for existing TradingAnalyzer:", error);
      return;
    }

    setHasCloned(!!data);
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
          name: "TradingAnalyzer",
          profile_id: profile.user.id,
        })
        .select()
        .single();

      if (crewError || !crew) {
        throw new Error("Failed to create crew");
      }

      // Create agents and their tasks
      for (const agent of DEFAULT_AGENTS) {
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
          console.error("Error creating agent:", agentError);
          continue;
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
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full"
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
      <p className="text-sm text-gray-600 max-w-md text-center">
        {hasCloned
          ? "You have successfully cloned the Trading Analyzer. Check your crews list to view and manage it."
          : "Clone our trading analyzer to get started with pre-configured agents and tasks."}
      </p>
    </div>
  );
}