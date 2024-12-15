import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useCrews() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getPublicCrews = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/crews/public');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCrew = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crews/get?id=${id}`);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createCrew = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/crews/create', {
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

    const updateCrew = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crews/update?id=${id}`, {
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

    const deleteCrew = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crews/delete?id=${id}`, { method: 'DELETE' });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCrewExecutions = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crews/executions?id=${id}`);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const addCrewExecution = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crews/executions/add?id=${id}`, {
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

