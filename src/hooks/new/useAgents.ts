import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useAgents() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getAgent = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/agents/get?id=${id}`);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createAgent = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/agents/create', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateAgent = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/agents/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAgent = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/agents/delete?id=${id}`, { method: 'DELETE' });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { getAgent, createAgent, updateAgent, deleteAgent, loading, error };
}

