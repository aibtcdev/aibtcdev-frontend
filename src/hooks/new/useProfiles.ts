import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useProfiles() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getProfileRole = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/profiles/role');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getProfile = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/profiles/get?id=${id}`);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/profiles/create', {
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

    const updateProfile = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/profiles/update?id=${id}`, {
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

    const deleteProfile = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/profiles/delete?id=${id}`, { method: 'DELETE' });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const listAdminProfiles = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/profiles/admin/list');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateAdminProfile = async (id: string, data: any) => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth(`/profiles/admin/update?id=${id}`, {
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

    return {
        getProfileRole,
        getProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        listAdminProfiles,
        updateAdminProfile,
        loading,
        error,
    };
}

