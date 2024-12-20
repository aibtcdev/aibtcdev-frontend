// types/supabase.ts

export interface CronEntry {
  id?: number;
  profile_id?: string;
  crew_id?: number;
  enabled: boolean;
  input: string;
  created_at?: string;
}

export interface Crew {
  id: number;
  name: string;
  description: string;
  created_at: string;
  is_public?: boolean;
  profile_id?: string;
}

export interface CrewWithCron extends Crew {
  cron?: CronEntry | null;
}

export interface CrewFormProps {
  onCrewCreated: (crew: CrewWithCron) => void;
  onClose: () => void;
  editingCrew?: CrewWithCron | null;
}

export interface CrewManagementProps {
  initialCrews: CrewWithCron[];
  onCrewUpdate: (crews: CrewWithCron[]) => void;
}

export interface RawCrewData {
  id: number;
  name: string;
  description: string;
  created_at: string;
  is_public: boolean;
  profile_id: string;
  crons?: Array<{
    id: number;
    enabled: boolean;
    input: string;
    created_at: string;
  }>;
}

// Interface representing an agent
export interface Agent {
    id: number;
    name: string;
    role: string;
    goal: string;
    backstory: string;
    agent_tools: string[]; // Array of agent tools
}

// Interface for props of the AgentForm component
export interface AgentFormProps {
    agent?: Agent; // Optional existing agent to edit
    onSubmit: (agent: Omit<Agent, "id">) => Promise<void>; // Callback for submitting the agent form
    loading: boolean; // Indicates if the form is currently loading
}

// Interface for props of the AgentManagement component
export interface AgentManagementProps {
    crewId: number; // ID of the current crew
    onAgentAdded: () => void; // Callback for when a new agent is added
}

// Interface representing a task
export interface Task {
    id: number;
    description: string;
    expected_output: string;
    agent_id: number; // ID of the assigned agent
    profile_id: string; // ID of the associated profile
}

// Interface for props of the TaskForm component
export interface TaskFormProps {
    crewId: number; // ID of the current crew
    agents: Agent[]; // Array of agents
    task?: Task; // Optional existing task to edit
    onTaskSubmitted: () => void; // Callback for when a task is submitted
    onClose: () => void; // Callback for when the form is closed
}

// Interface for props of the TaskManagement component
export interface TaskManagementProps {
    crewId: number; // ID of the current crew
    onTaskAdded: () => void; // Callback for when a new task is added
    tasks: Task[]; // Array of tasks
    agents: Agent[]; // Array of agents
    currentUser: string | null; // ID of the current user
    onEditTask: (task: Task) => void; // Callback for editing a task
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


// INTERFACE FOR PUBLIC CREWS

interface PublicTask {
    id: number;
    description: string;
    expected_output: string;
    agent_id: number;
    profile_id: string;
  }
  
 interface PublicAgent {
    id: number;
    name: string;
    role: string;
    goal: string;
    backstory: string;
    agent_tools: string[];
    tasks: PublicTask[];
  }
  
export  interface PublicCrew {
    id: number;
    name: string;
    description: string;
    created_at: string;
    creator_email: string;
    clones: number
    agents: PublicAgent[];
  }

  export interface Profile {
    email: string;
    assigned_agent_address: string | null;
  }
  
  export interface ProfileWithBalance extends Profile {
    portfolioValue: number;
    rank: number;
    isLoadingBalance: boolean;
    balances?: BalanceResponse; // Optional because it may be undefined until loaded
    tokenPrices?: Record<string, number>; // Map contract ID to token price
  }
  
  
  export interface BalanceResponse {
    stx: {
      balance: string;
    };
    fungible_tokens: {
      [key: string]: {
        balance: string;
      };
    };
  }
  
  export interface TokenPrice {
    symbol?: string;
    contract_id?: string;
    metrics: {
      price_usd: number;
    };
    decimals:number;
  }