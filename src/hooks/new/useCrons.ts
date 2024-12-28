import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export interface UserCronsTable {
    id?: number;
    profile_id: string | null;
    crew_id: string;
    cron_enabled: number;
    cron_interval?: string;
    cron_input?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CronResponse {
    id: number;
    profile_id: string;
    crew_id: string;
    cron_enabled: number;
    cron_interval: string;
    cron_input: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateCronInput {
    cron_input: string;
}

export interface ToggleCronStatus {
    cron_enabled: number;
}

export function useCrons() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleRequest = useCallback(async <T>(
        request: Promise<T>,
        errorMessage: string = 'An error occurred'
    ): Promise<T> => {
        setLoading(true);
        setError(null);
        try {
            return await request;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getEnabledCrons = useCallback(() =>
        handleRequest<CronResponse[]>(
            fetchWithAuth('/crons/enabled').then(res => res.crons),
            'Failed to fetch enabled crons'
        ),
        [handleRequest]
    );

    const getEnabledCronsDetailed = useCallback(() =>
        handleRequest<CronResponse[]>(
            fetchWithAuth('/crons/enabled/detailed').then(res => res.crons),
            'Failed to fetch detailed enabled crons'
        ),
        [handleRequest]
    );

    const getCronsByCrew = useCallback((crewId: number) =>
        handleRequest<CronResponse[]>(
            fetchWithAuth(`/crons/get?crewId=${crewId}`).then(res => res.crons),
            'Failed to fetch crew crons'
        ),
        [handleRequest]
    );

    const createCron = useCallback((data: UserCronsTable) =>
        handleRequest<CronResponse>(
            fetchWithAuth('/crons/create', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.cron),
            'Failed to create cron'
        ),
        [handleRequest]
    );

    const updateCronInput = useCallback((id: number, cron_input: string) =>
        handleRequest<CronResponse>(
            fetchWithAuth(`/crons/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ cron_input }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.result),
            'Failed to update cron input'
        ),
        [handleRequest]
    );

    const toggleCronStatus = useCallback((id: number, enabled: boolean) =>
        handleRequest<CronResponse>(
            fetchWithAuth(`/crons/toggle?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ cron_enabled: enabled ? 1 : 0 }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.result),
            'Failed to toggle cron status'
        ),
        [handleRequest]
    );

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