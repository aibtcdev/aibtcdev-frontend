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

    return {
        loading,
        error,
        getCrew,
        createCrew,
        updateCrew,
        deleteCrew,
        getCrewExecutions,
        addCrewExecution,
    };
}