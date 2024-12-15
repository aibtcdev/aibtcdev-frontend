
import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useTasks() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getTask = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/ tasks / get ? id = ${id} `);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const listTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/tasks/list');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createTask = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/tasks/create', {
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

    const updateTask = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/ tasks / update ? id = ${id} `, {
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

    const deleteTask = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/ tasks / delete? id = ${id} `, { method: 'DELETE' });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAllTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/tasks/delete-all', { method: 'DELETE' });
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

