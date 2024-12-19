import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useCrews() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getPublicCrews = async () => {
        setLoading(true);
        setError(null);
        try {
            const { crews } = await fetchWithAuth('/crews/public');
            return crews;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCrew = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const { crew } = await fetchWithAuth(`/crews/get?id=${id}`);
            return crew;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createCrew = async (profile_id: string, crew_name: string, crew_description: string) => {
        setLoading(true);
        setError(null);
        try {
            const { crew } = await fetchWithAuth('/crews/create', {
                method: 'POST',
                body: JSON.stringify({ profile_id, crew_name, crew_description }),
                headers: { 'Content-Type': 'application/json' },
            });
            return crew;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateCrew = async (id: number, updates: any) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/crews/update?id=${id}`, {
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

    const deleteCrew = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/crews/delete?id=${id}`, { method: 'DELETE' });
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCrewExecutions = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const { executions } = await fetchWithAuth(`/crews/executions?address=${address}`);
            return executions;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const addCrewExecution = async (data: { address: string; crewId: number; conversationId: number; input: string }) => {
        setLoading(true);
        setError(null);
        try {
            const { execution } = await fetchWithAuth('/crews/executions/add', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
            return execution;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        getPublicCrews,
        getCrew,
        createCrew,
        updateCrew,
        deleteCrew,
        getCrewExecutions,
        addCrewExecution,
        loading,
        error,
    };
}

