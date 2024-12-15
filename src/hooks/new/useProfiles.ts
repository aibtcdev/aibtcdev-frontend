import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';
export function useProfiles() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getUserRole = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const { role } = await fetchWithAuth(`/profiles/role?address=${address}`);
            return role;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getUserProfile = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const { profile } = await fetchWithAuth(`/profiles/get?address=${address}`);
            return profile;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createUserProfile = async (profileData: any) => {
        setLoading(true);
        setError(null);
        try {
            const { profile } = await fetchWithAuth('/profiles/create', {
                method: 'POST',
                body: JSON.stringify(profileData),
                headers: { 'Content-Type': 'application/json' },
            });
            return profile;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (address: string, profileData: any) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/profiles/update?address=${address}`, {
                method: 'PUT',
                body: JSON.stringify(profileData),
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

    const deleteUserProfile = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/profiles/delete?address=${address}`, { method: 'DELETE' });
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getAllUserProfiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const { profiles } = await fetchWithAuth('/profiles/admin/list');
            return profiles;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfileById = async (userId: number, updates: any) => {
        setLoading(true);
        setError(null);
        try {
            const { result } = await fetchWithAuth(`/profiles/admin/update?userId=${userId}`, {
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

    return {
        getUserRole,
        getUserProfile,
        createUserProfile,
        updateUserProfile,
        deleteUserProfile,
        getAllUserProfiles,
        updateUserProfileById,
        loading,
        error,
    };
}

