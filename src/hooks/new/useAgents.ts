import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

// Define Agent interface based on the response structure
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

// Interface for creating an agent
export interface CreateAgentData {
    profile_id: string;
    crew_id: number;
    agent_name: string;
    agent_role: string;
    agent_goal: string;
    agent_backstory: string;
}

export function useAgents() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getAgents = async (crewId: number): Promise<Agent[]> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/agents/get?crewId=${crewId}`);
            return response.agents.agents; // Extract the agents array
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createAgent = async (agentData: CreateAgentData): Promise<Agent> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth('/agents/create', {
                method: 'POST',
                body: JSON.stringify(agentData),
                headers: { 'Content-Type': 'application/json' },
            });
            return response.agent;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateAgent = async (id: number, updates: Partial<Agent>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/agents/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
                headers: { 'Content-Type': 'application/json' },
            });
            return response.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAgent = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/agents/delete?id=${id}`, {
                method: 'DELETE'
            });
            return response.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        getAgents,
        createAgent,
        updateAgent,
        deleteAgent,
        loading,
        error
    };
}