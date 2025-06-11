import type { Agent, Task } from "./agent";
import type { CrewWithCron } from "./crew";

export interface ChainState {
  id: string;
  created_at: string;
  updated_at: string | null;
  network: string | null;
  block_hash: string | null;
  block_height: string | null;
  bitcoin_block_height: string | null;
}

// Component Props Interfaces
export interface AgentFormProps {
  agent?: Agent; // Optional existing agent to edit
  onSubmit: (agent: Omit<Agent, "id">) => Promise<void>; // Callback for submitting the agent form
  loading: boolean; // Indicates if the form is currently loading
}

export interface AgentManagementProps {
  crewId: string; // ID of the current crew
  onAgentAdded: () => void; // Callback for when a new agent is added
}

export interface TaskFormProps {
  crewId: string; // ID of the current crew
  agents: Agent[]; // Array of agents
  task?: Task; // Optional existing task to edit
  onTaskSubmitted: () => void; // Callback for when a task is submitted
  onClose: () => void; // Callback for when the form is closed
}

export interface TaskManagementProps {
  crewId: string; // ID of the current crew
  onTaskAdded: () => void; // Callback for when a new task is added
  tasks: Task[]; // Array of tasks
  agents: Agent[]; // Array of agents
  currentUser: string | null; // ID of the current user
  onEditTask: (task: Task) => void; // Callback for editing a task
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
