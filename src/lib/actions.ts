'use server';

import { ServicesSDK, type Agent, type Crew, type Task } from './services';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Initialize SDK
const sdk = new ServicesSDK({
  secretKey: process.env.AIBTC_SECRET_KEY!
});

// Types for action responses
interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper to handle common error patterns
async function handleAction<T>(
  action: () => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    console.error('Action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Authentication & Authorization
export async function getCurrentUser() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('sessionToken');
  const stxAddress = cookieStore.get('stxAddress');

  if (!sessionToken || !stxAddress) {
    return null;
  }

  try {
    const profile = await sdk.getUserProfile(stxAddress.value);
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Crew Management
export async function createCrew(
  formData: FormData | { name: string; profileId: string }
): Promise<ActionResponse<Crew>> {
  return handleAction(async () => {
    await requireAuth();
    const name = formData instanceof FormData ? formData.get('name') as string : formData.name;
    const profileId = formData instanceof FormData ? formData.get('profileId') as string : formData.profileId;

    const crew = await sdk.createCrew(profileId, name);
    revalidatePath('/crews');
    return crew;
  });
}

export async function updateCrew(
  id: number,
  updates: Partial<Crew>
): Promise<ActionResponse> {
  return handleAction(async () => {
    await requireAuth();
    await sdk.updateCrew(id, updates);
    revalidatePath('/crews');
  });
}

export async function deleteCrew(id: number): Promise<ActionResponse> {
  return handleAction(async () => {
    await requireAuth();
    await sdk.deleteCrew(id);
    revalidatePath('/crews');
  });
}

export async function getCrew(id: number): Promise<ActionResponse<Crew>> {
  return handleAction(async () => {
    const crew = await sdk.getCrew(id);
    return crew;
  });
}

export async function getCrewsByProfile(profileId: string): Promise<ActionResponse<Crew[]>> {
  return handleAction(async () => {
    const crews = await sdk.getPublicCrews();
    return crews.filter(crew => crew.profile_id === profileId);
  });
}

export async function getPublicCrews(): Promise<ActionResponse<Crew[]>> {
  return handleAction(async () => {
    return sdk.getPublicCrews();
  });
}

// Agent Management
export async function createAgent(
  formData: FormData | Omit<Agent, 'id' | 'created_at' | 'updated_at'>
): Promise<ActionResponse<Agent>> {
  return handleAction(async () => {
    await requireAuth();
    const agentData = formData instanceof FormData ? {
      profile_id: formData.get('profile_id') as string,
      crew_id: Number(formData.get('crew_id')),
      agent_name: formData.get('agent_name') as string,
      agent_role: formData.get('agent_role') as string,
      agent_goal: formData.get('agent_goal') as string,
      agent_backstory: formData.get('agent_backstory') as string,
      agent_tools: formData.get('agent_tools') as string
    } : formData;

    const agent = await sdk.createAgent(agentData);
    revalidatePath(`/crews/${agentData.crew_id}/agents`);
    return agent;
  });
}

export async function updateAgent(
  id: number,
  updates: Partial<Agent>
): Promise<ActionResponse> {
  return handleAction(async () => {
    await requireAuth();
    await sdk.updateAgent(id, updates);
    revalidatePath(`/crews/${updates.crew_id}/agents`);
  });
}

export async function deleteAgent(id: number, crewId: number): Promise<ActionResponse> {
  return handleAction(async () => {
    await requireAuth();
    await sdk.deleteAgent(id);
    revalidatePath(`/crews/${crewId}/agents`);
  });
}

export async function getAgentsByCrew(crewId: number): Promise<ActionResponse<Agent[]>> {
  return handleAction(async () => {
    return sdk.getAgents(crewId);
  });
}

// Task Management
export async function createTask(
  formData: FormData | Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<ActionResponse<Task>> {
  return handleAction(async () => {
    await requireAuth();
    const taskData = formData instanceof FormData ? {
      profile_id: formData.get('profile_id') as string,
      crew_id: Number(formData.get('crew_id')),
      agent_id: Number(formData.get('agent_id')),
      task_name: formData.get('task_name') as string,
      task_description: formData.get('task_description') as string,
      task_expected_output: formData.get('task_expected_output') as string
    } : formData;

    const task = await sdk.createTask(taskData);
    revalidatePath(`/crews/${taskData.crew_id}/agents/${taskData.agent_id}/tasks`);
    return task;
  });
}

export async function updateTask(
  id: number,
  updates: Partial<Task>
): Promise<ActionResponse> {
  return handleAction(async () => {
    await requireAuth();
    await sdk.updateTask(id, updates);
    revalidatePath(`/crews/${updates.crew_id}/agents/${updates.agent_id}/tasks`);
  });
}

export async function deleteTask(
  id: number,
  crewId: number,
  agentId: number
): Promise<ActionResponse> {
  return handleAction(async () => {
    await requireAuth();
    await sdk.deleteTask(id);
    revalidatePath(`/crews/${crewId}/agents/${agentId}/tasks`);
  });
}

export async function getTasksByAgent(agentId: number): Promise<ActionResponse<Task[]>> {
  return handleAction(async () => {
    return sdk.listTasks(agentId);
  });
}

// Usage in a Server Component:
/*
async function CrewList() {
    const { data: crews, error } = await getPublicCrews();

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            {crews?.map(crew => (
                <div key={crew.id}>{crew.crew_name}</div>
            ))}
        </div>
    );
}
*/

// Usage in a Client Component:
/*
'use client';

import { useTransition } from 'react';
import { createCrew } from './actions';

function CreateCrewForm() {
    const [isPending, startTransition] = useTransition();
    
    const onSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await createCrew(formData);
            if (result.success) {
                // Handle success
            } else {
                // Handle error
            }
        });
    };
    
    return (
        <form action={onSubmit}>
            <input name="name" required />
            <button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Crew'}
            </button>
        </form>
    );
}
*/