import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useCrons() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getEnabledCrons = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/crons/enabled');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getEnabledCronsDetailed = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/crons/enabled/detailed');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCron = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crons/get?id=${id}`);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createCron = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/crons/create', {
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

    const updateCron = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crons/update?id=${id}`, {
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

    const toggleCron = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/crons/toggle?id=${id}`, { method: 'PUT' });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        getEnabledCrons,
        getEnabledCronsDetailed,
        getCron,
        createCron,
        updateCron,
        toggleCron,
        loading,
        error,
    };
}

