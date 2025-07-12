export interface CronEntry {
  id?: string;
  profile_id?: string;
  crew_id?: string;
  is_enabled: boolean;
  input: string;
  created_at?: string;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  created_at: string;
  is_public?: boolean;
  profile_id?: string;
}

export interface CrewWithCron extends Crew {
  cron?: CronEntry | null;
}

export interface RawCrewData {
  id: string;
  name: string;
  description: string;
  created_at: string;
  is_public: boolean;
  profile_id: string;
  crons?: Array<{
    id: string;
    is_enabled: boolean;
    input: string;
    created_at: string;
  }>;
}

export interface PublicCrew {
  id: string;
  name: string;
  description: string;
  created_at: string;
  creator_email: string;
  clones: number;
  agents: PublicAgent[];
}

interface PublicTask {
  id: string;
  description: string;
  expected_output: string;
  agent_id: string;
  profile_id: string;
}

interface PublicAgent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  agent_tools: string[];
  tasks: PublicTask[];
}

// Interface for a cloned agent
export interface CloneAgent {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  agent_tools: string[]; // Array of agent tools
}

// Interface for a cloned task
export interface CloneTask {
  description: string;
  expected_output: string;
}
