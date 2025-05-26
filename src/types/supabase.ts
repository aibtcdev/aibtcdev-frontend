// types/supabase.ts

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

export interface Token {
  id: string;
  dao_id: string;
  contract_principal: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string;
  max_supply: number;
}

export type SortField =
  | "created_at"
  | "price"
  | "price24hChanges"
  | "marketCap"
  | "newest"
  | "oldest"
  | "holders";

export interface DAO {
  id: string;
  name: string;
  website_url: string;
  x_url: string;
  telegram_url: string;
  mission: string;
  description: string;
  image_url: string;
  is_graduated: boolean;
  is_deployed: boolean;
  created_at: string;
  author_id: string;
  user_id?: string;
  extensions?: Array<{
    id: string;
    type: string;
    contract_principal?: string;
  }>;
}

export interface Holder {
  address: string;
  balance: string;
  percentage: number;
}

export interface Extension {
  id: string;
  created_at: string;
  updated_at: string;
  dao_id: string;
  type: string;
  subtype: string;
  contract_principal: string;
  tx_id: string;
  symbol: string | null;
  decimals: number | null;
  max_supply: string | null;
  uri: string | null;
  image_url: string | null;
  description: string | null;
  is_deployed: boolean;
  status: string | null;
}

export interface Proposal {
  token_symbol: string | undefined;
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: "DRAFT" | "PENDING" | "DEPLOYED" | "FAILED";
  contract_principal: string;
  tx_id: string;
  dao_id: string;
  proposal_id: string;
  action: string;
  caller: string;
  creator: string;
  created_at_block: number;
  end_block: number;
  start_block: number;
  liquid_tokens: number | null;
  parameters: string;
  concluded_by: string;
  executed: boolean;
  met_quorum: boolean;
  met_threshold: boolean;
  passed: boolean;
  votes_against: string;
  votes_for: string;
}

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

// Interface representing an agent
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
}

// Interface for props of the AgentForm component
export interface AgentFormProps {
  agent?: Agent; // Optional existing agent to edit
  onSubmit: (agent: Omit<Agent, "id">) => Promise<void>; // Callback for submitting the agent form
  loading: boolean; // Indicates if the form is currently loading
}

// Interface for props of the AgentManagement component
export interface AgentManagementProps {
  crewId: string; // ID of the current crew
  onAgentAdded: () => void; // Callback for when a new agent is added
}

// Interface for props of the TaskForm component
export interface TaskFormProps {
  crewId: string; // ID of the current crew
  agents: Agent[]; // Array of agents
  task?: Task; // Optional existing task to edit
  onTaskSubmitted: () => void; // Callback for when a task is submitted
  onClose: () => void; // Callback for when the form is closed
}

// Interface for props of the TaskManagement component
export interface TaskManagementProps {
  crewId: string; // ID of the current crew
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

export interface PublicCrew {
  id: string;
  name: string;
  description: string;
  created_at: string;
  creator_email: string;
  clones: number;
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
  decimals: number;
}

export interface Wallet {
  id: string;
  created_at: string;
  agent_id: string;
  profile_id: string;
  mainnet_address: string;
  testnet_address: string;
  secret_id: string;
}
