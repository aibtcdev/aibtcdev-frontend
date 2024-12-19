// Base types and interfaces
export interface BaseResponse {
  success: boolean;
  error?: string;
}

// Common types across different domains
export interface Agent {
  id: number;
  created_at: string;
  updated_at: string;
  profile_id: string;
  crew_id: number;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  agent_backstory: string;
  agent_tools: string | null;
}

export interface Task {
  id: number;
  created_at: string;
  updated_at: string;
  profile_id: string;
  crew_id: number;
  agent_id: number;
  task_name: string;
  task_description: string;
  task_expected_output: string;
}

export interface Conversation {
  id: number;
  profile_id: string;
  conversation_name: string;
  created_at: string;
  updated_at: string;
}

export interface Crew {
  id: number;
  profile_id: string;
  crew_name: string;
  crew_description?: string;
  crew_is_public: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: number;
  stx_address: string;
  user_role: 'normal' | 'admin';
  created_at: string;
  updated_at: string;
}

// SDK Configuration
interface Config {
  baseUrl?: string;
  secretKey: string;
}

// Main SDK Class
export class ServicesSDK {
  private baseUrl: string;
  private secretKey: string;

  constructor(config: Config) {
    this.baseUrl = config.baseUrl || 'https://services.aibtc.dev/database';
    this.secretKey = config.secretKey;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', this.secretKey);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Agents API
  public async getAgents(crewId: number): Promise<Agent[]> {
    const response = await this.fetchWithAuth(`/agents/get?crewId=${crewId}`);
    return response.agents.agents;
  }

  public async createAgent(agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
    const response = await this.fetchWithAuth('/agents/create', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
    return response.agent;
  }

  public async updateAgent(id: number, updates: Partial<Agent>): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/agents/update?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response;
  }

  public async deleteAgent(id: number): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/agents/delete?id=${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Tasks API
  public async getTask(id: number): Promise<Task> {
    const response = await this.fetchWithAuth(`/tasks/get?id=${id}`);
    return response.task;
  }

  public async listTasks(agentId: number): Promise<Task[]> {
    const response = await this.fetchWithAuth(`/tasks/list?agentId=${agentId}`);
    return response.tasks.tasks;
  }

  public async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const response = await this.fetchWithAuth('/tasks/create', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response.task;
  }

  public async updateTask(id: number, updates: Partial<Task>): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/tasks/update?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response;
  }

  public async deleteTask(id: number): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/tasks/delete?id=${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  public async deleteAllTasks(agentId: number): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/tasks/delete-all?agentId=${agentId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Conversations API
  public async getConversations(address: string): Promise<Conversation[]> {
    const response = await this.fetchWithAuth(`/conversations?address=${address}`);
    return response.conversations;
  }

  public async getLatestConversation(address: string): Promise<Conversation> {
    const response = await this.fetchWithAuth(`/conversations/latest?address=${address}`);
    return response.conversation;
  }

  public async getConversationHistory(id: number) {
    const response = await this.fetchWithAuth(`/conversations/history?id=${id}`);
    return response.history;
  }

  // Crews API
  public async getPublicCrews(): Promise<Crew[]> {
    const response = await this.fetchWithAuth('/crews/public');
    return response.crews;
  }

  public async getCrew(id: number): Promise<Crew> {
    const response = await this.fetchWithAuth(`/crews/get?id=${id}`);
    return response.crew;
  }

  public async createCrew(profileId: string, crewName: string): Promise<Crew> {
    const response = await this.fetchWithAuth('/crews/create', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId, crew_name: crewName }),
    });
    return response.crew;
  }

  public async updateCrew(id: number, updates: Partial<Crew>): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/crews/update?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response;
  }

  public async deleteCrew(id: number): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/crews/delete?id=${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Profiles API
  public async getUserProfile(address: string): Promise<Profile> {
    const response = await this.fetchWithAuth(`/profiles/get?address=${address}`);
    return response.profile;
  }

  public async createUserProfile(profileData: {
    stx_address: string;
    user_role: 'normal' | 'admin';
  }): Promise<Profile> {
    const response = await this.fetchWithAuth('/profiles/create', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return response.profile;
  }

  public async updateUserProfile(
    address: string,
    profileData: Partial<Profile>
  ): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/profiles/update?stx_address=${address}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response;
  }

  public async deleteUserProfile(address: string): Promise<BaseResponse> {
    const response = await this.fetchWithAuth(`/profiles/delete?stx_address=${address}`, {
      method: 'DELETE',
    });
    return response;
  }
}

// Usage example:
/*
const sdk = new ServicesSDK({
  secretKey: process.env.NEXT_PUBLIC_AIBTC_SECRET_KEY!
});

// Using in React components
const MyComponent = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  
  useEffect(() => {
      const loadAgents = async () => {
          try {
              const agentsList = await sdk.getAgents(crewId);
              setAgents(agentsList);
          } catch (error) {
              console.error('Failed to load agents:', error);
          }
      };
      
      loadAgents();
  }, []);
  
  return <div>{/* Your component JSX *\/}</div>;
};

// Using in Server Components
const ServerComponent = async () => {
  const agents = await sdk.getAgents(crewId);
  return <div>{/* Your server component JSX *\/}</div>;
};
*/