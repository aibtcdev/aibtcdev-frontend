import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useCrons() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getEnabledCrons = async () => {
        setLoading(true);
        setError(null);
        try {
            const { crons } = await fetchWithAuth('/crons/enabled');
            return crons;
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
            const { crons } = await fetchWithAuth('/crons/enabled/detailed');
            return crons;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCronsByCrew = async (crewId: number) => {
        setLoading(true);
        setError(null);
        try {
            const { crons } = await fetchWithAuth(`/crons/get?crewId=${crewId}`);
            return crons;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createCron = async (cronData: any) => {
        setLoading(true);
        setError(null);
        try {
            const { cron } = await fetchWithAuth('/crons/create', {
                method: 'POST',
                body: JSON.stringify(cronData),
                headers: { 'Content-Type': 'application/json' },
            });
            return cron;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateCronInput = async (id: number, cronInput: string) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/crons/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ cron_input: cronInput }),
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

    const toggleCronStatus = async (id: number, enabled: boolean) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/crons/toggle?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ cron_enabled: enabled }),
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

    return {
        getEnabledCrons,
        getEnabledCronsDetailed,
        getCronsByCrew,
        createCron,
        updateCronInput,
        toggleCronStatus,
        loading,
        error,
    };
}

