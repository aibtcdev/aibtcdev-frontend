export interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  image_url?: string;
  agent_tools: string[];
  profile_id: string;
  is_archived?: boolean;
  account_contract?: string;
}

export interface AgentPrompt {
  id: string;
  dao_id: string;
  agent_id: string;
  profile_id: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  model: string;
  temperature: number;
}

export interface Task {
  id: string;
  name: string;
  prompt: string;
  agent_id: string;
  cron: string;
  crew_id: string;
  profile_id: string;
  is_scheduled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  agent_id: string;
  profile_id: string;
  name: string;
  created_at: string;
}

export interface Job {
  id: string;
  created_at: string;
  task_id: string;
  agent_id: string;
  profile_id: string;
  status: string;
  result?: string;
  error?: string;
  task_name?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters?: string;
}
