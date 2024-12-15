import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useTasks() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getTask = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const { task } = await fetchWithAuth(`/tasks/get?id=${id}`);
            return task;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const listTasks = async (agentId: number) => {
        setLoading(true);
        setError(null);
        try {
            const { tasks } = await fetchWithAuth(`/tasks/list?agentId=${agentId}`);
            return tasks;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createTask = async (taskData: any) => {
        setLoading(true);
        setError(null);
        try {
            const { task } = await fetchWithAuth('/tasks/create', {
                method: 'POST',
                body: JSON.stringify(taskData),
                headers: { 'Content-Type': 'application/json' },
            });
            return task;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateTask = async (id: number, updates: any) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/tasks/update?id=${id}`, {
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

    const deleteTask = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/tasks/delete?id=${id}`, { method: 'DELETE' });
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAllTasks = async (agentId: number) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/tasks/delete-all?agentId=${agentId}`, { method: 'DELETE' });
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

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

