import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

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
    agent_tools: string[];
}

export interface AgentFormData {
    agent_name: string;
    agent_role: string;
    agent_goal: string;
    agent_backstory: string;
    agent_tools: string[];
}

export interface CreateAgentData extends AgentFormData {
    profile_id: string;
    crew_id: number;
}

export function useAgents() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getAgents = useCallback(async (crewId: number): Promise<Agent[]> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/agents/get?crewId=${crewId}`);
            return response.agents.agents;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createAgent = useCallback(async (agentData: CreateAgentData): Promise<Agent> => {
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
    }, []);

    const updateAgent = useCallback(async (id: number, updates: Partial<AgentFormData>): Promise<Agent> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/agents/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
                headers: { 'Content-Type': 'application/json' },
            });
            return response.agent;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteAgent = useCallback(async (id: number): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            await fetchWithAuth(`/agents/delete?id=${id}`, {
                method: 'DELETE'
            });
            return true;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getAgents,
        createAgent,
        updateAgent,
        deleteAgent,
        loading,
        error
    };
}