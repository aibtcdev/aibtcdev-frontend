import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useAgents() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getAgents = async (crewId: number) => {
        setLoading(true);
        setError(null);
        try {
            const { agents } = await fetchWithAuth(`/agents/get?crewId=${crewId}`);
            return agents;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createAgent = async (agentData: any) => {
        setLoading(true);
        setError(null);
        try {
            const { agent } = await fetchWithAuth('/agents/create', {
                method: 'POST',
                body: JSON.stringify(agentData),
                headers: { 'Content-Type': 'application/json' },
            });
            return agent;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateAgent = async (id: number, updates: any) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/agents/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
                headers: { 'Content-Type': 'application/json' },
            });
            return result;
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
            const { result } = await fetchWithAuth(`/agents/delete?id=${id}`, { method: 'DELETE' });
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { getAgents, createAgent, updateAgent, deleteAgent, loading, error };
}

