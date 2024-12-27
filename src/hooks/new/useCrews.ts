import { useCallback, useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export interface Crew {
    id: number;
    created_at: string;
    updated_at: string;
    profile_id: string;
    crew_name: string;
    crew_description: string | null;
    crew_executions: number;
    crew_is_public: 0 | 1;
    crew_is_cron: 0 | 1;
}

export interface CronConfig {
    id: number;
    crewId: number;
    enabled: boolean;
    schedule: string;
    last_run?: string;
    next_run?: string;
}

export interface CrewFormData {
    crew_name: string;
    crew_description: string;
    crew_is_cron?: 0 | 1;
}

export interface CrewExecution {
    address: string;
    crewId: number;
    conversationId: number;
    input: string;
}

export interface CreateCronConfig {
    profile_id: string;
    crew_id: string;
    cron_enabled: boolean;
}

export function useCrews() {
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

    const getCrew = useCallback((id: number) =>
        handleRequest<Crew>(
            fetchWithAuth(`/crews/get?id=${id}`).then(res => res.crew.crew),
            `Failed to fetch crew ${id}`
        ),
        [handleRequest]);

    const createCrew = useCallback((profile_id: string, crew_name: string, crew_description: string) =>
        handleRequest<Crew>(
            fetchWithAuth('/crews/create', {
                method: 'POST',
                body: JSON.stringify({ profile_id, crew_name, crew_description }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.crew),
            'Failed to create crew'
        ),
        [handleRequest]);

    const updateCrew = useCallback((id: number, updates: Partial<CrewFormData>) =>
        handleRequest<Crew>(
            fetchWithAuth('/crews/update', {
                method: 'POST',
                body: JSON.stringify({ id, ...updates }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.crew),
            'Failed to update crew'
        ),
        [handleRequest]);

    const deleteCrew = useCallback((id: number) =>
        handleRequest<boolean>(
            fetchWithAuth(`/crews/delete?id=${id}`, {
                method: 'DELETE'
            }).then(() => true),
            'Failed to delete crew'
        ),
        [handleRequest]);

    const getCrewExecutions = useCallback((address: string) =>
        handleRequest<CrewExecution[]>(
            fetchWithAuth(`/crews/executions?address=${address}`).then(res => res.executions),
            'Failed to fetch crew executions'
        ),
        [handleRequest]);

    const addCrewExecution = useCallback((data: CrewExecution) =>
        handleRequest<CrewExecution>(
            fetchWithAuth('/crews/executions/add', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.execution),
            'Failed to add crew execution'
        ),
        [handleRequest]);

    const getCronConfig = useCallback((crewId: number) =>
        handleRequest<CronConfig>(
            fetchWithAuth(`/crons/get?crewId=${crewId}`).then(res => res.cron),
            'Failed to fetch cron config'
        ),
        [handleRequest]);

    // YET TO IMPLEMENT
    // const createCronConfig = useCallback((data: CreateCronConfig) =>
    //     handleRequest<CronConfig>(
    //         fetchWithAuth('/database/crons/create', {
    //             method: 'POST',
    //             body: JSON.stringify(data),
    //             headers: { 'Content-Type': 'application/json' },
    //         }).then(res => res.cron),
    //         'Failed to create cron config'
    //     ),
    //     [handleRequest]);

    const updateCronConfig = useCallback((crewId: number, schedule: string) =>
        handleRequest<CronConfig>(
            fetchWithAuth('/crons/update', {
                method: 'POST',
                body: JSON.stringify({ crewId: crewId, schedule }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.cron),
            'Failed to update cron config'
        ),
        [handleRequest]);

    const toggleCron = useCallback((crewId: number, enabled: boolean) =>
        handleRequest<CronConfig>(
            fetchWithAuth('/crons/toggle', {
                method: 'POST',
                body: JSON.stringify({ crewId: crewId, enabled }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.cron),
            'Failed to toggle cron'
        ),
        [handleRequest]);

    return {
        loading,
        error,
        getCrew,
        createCrew,
        updateCrew,
        deleteCrew,
        getCrewExecutions,
        addCrewExecution,
        getCronConfig,
        // createCronConfig,
        updateCronConfig,
        toggleCron,
    };
}

