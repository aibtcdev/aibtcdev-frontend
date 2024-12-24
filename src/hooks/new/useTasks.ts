import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

// Task interface based on the response structure
export interface Task {
    id: number;
    created_at: string;
    updated_at: string;
    profile_id: string;
    crew_id: number;
    agent_id: number;
    task_name: string;
    task_description: string;
    task_expected_output: string;
}

// Interface for creating a task
export interface CreateTaskData {
    profile_id: string;
    crew_id: number;
    agent_id: number;
    task_name: string;
    task_description: string;
    task_expected_output: string;
}

export function useTasks() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getTask = useCallback(async (id: number): Promise<Task> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/tasks/get?id=${id}`);
            return response.task;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const listTasks = useCallback(async (agentId: number): Promise<Task[]> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/tasks/list?agentId=${agentId}`);
            return response.tasks.tasks;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth('/tasks/create', {
                method: 'POST',
                body: JSON.stringify(taskData),
                headers: { 'Content-Type': 'application/json' },
            });
            return response.task;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTask = useCallback(async (id: number, updates: Partial<Task>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/tasks/update?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
                headers: { 'Content-Type': 'application/json' },
            });
            return response.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTask = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/tasks/delete?id=${id}`, {
                method: 'DELETE'
            });
            return response.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteAllTasks = useCallback(async (agentId: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/tasks/delete-all?agentId=${agentId}`, {
                method: 'DELETE'
            });
            return response.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getTask,
        listTasks,
        createTask,
        updateTask,
        deleteTask,
        deleteAllTasks,
        loading,
        error,
    };
}
