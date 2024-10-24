"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckIcon } from "lucide-react";

interface Agent {
  id?: number;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  agent_tools: string[];
}

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (agent: Omit<Agent, "id">) => Promise<void>;
  loading: boolean;
}

const AVAILABLE_TOOLS = [
  "alex_get_price_history",
  "alex_get_swap_info",
  "alex_get_token_pool_volume",
  "bitflow_get_available_tokens",
  "bitflow_execute_trade",
  "lunarcrush_get_token_data",
  "web_search_experimental",
];

export default function AgentForm({
  agent,
  onSubmit,
  loading,
}: AgentFormProps) {
  const [agentName, setAgentName] = useState(agent?.name || "");
  const [role, setRole] = useState(agent?.role || "");
  const [goal, setGoal] = useState(agent?.goal || "");
  const [backstory, setBackstory] = useState(agent?.backstory || "");
  const [selectedTools, setSelectedTools] = useState<string[]>(
    agent?.agent_tools || []
  );
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  useEffect(() => {
    if (agent) {
      setAgentName(agent.name);
      setRole(agent.role);
      setGoal(agent.goal);
      setBackstory(agent.backstory);
      setSelectedTools(agent.agent_tools);
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: agentName,
      role,
      goal,
      backstory,
      agent_tools: selectedTools,
    });
  };

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="agentName">Agent Name</Label>
        <Input
          id="agentName"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Enter agent name"
          required
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Enter role"
          required
        />
      </div>
      <div>
        <Label htmlFor="goal">Goal</Label>
        <Input
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Enter goal"
          required
        />
      </div>
      <div>
        <Label htmlFor="backstory">Backstory</Label>
        <Textarea
          id="backstory"
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          placeholder="Enter backstory"
        />
      </div>
      <div className="relative">
        <Label>Agent Tools</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
        >
          {selectedTools.length > 0
            ? `${selectedTools.length} tool${
                selectedTools.length > 1 ? "s" : ""
              } selected`
            : "Select tools"}
          <CheckIcon className="h-4 w-4 opacity-50" />
        </Button>
        {isToolsDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
            {AVAILABLE_TOOLS.map((tool) => (
              <div key={tool} className="flex items-center space-x-2 p-2">
                <Checkbox
                  id={tool}
                  checked={selectedTools.includes(tool)}
                  onCheckedChange={() => handleToolToggle(tool)}
                />
                <label
                  htmlFor={tool}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tool}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedTools.map((tool) => (
          <div
            key={tool}
            className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm"
          >
            {tool}
            <button
              type="button"
              onClick={() => handleToolToggle(tool)}
              className="ml-2 text-primary-foreground hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : agent ? "Update Agent" : "Create Agent"}
      </Button>
    </form>
  );
}
