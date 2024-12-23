import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

interface ProfileData {
    stx_address: string;
}

interface CreateProfileData extends ProfileData {
    user_role: 'normal' | 'admin';
}

export function useProfiles() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getUserProfile = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth(`/profiles/get?address=${address}`);
            return data.profile;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getUserRole = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth(`/profiles/role?address=${address}`);
            return data.role.role;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch user role'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createUserProfile = async (profileData: CreateProfileData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth('/profiles/create', {
                method: 'POST',
                body: JSON.stringify(profileData),
            });
            return data.profile;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create user profile'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (address: string, profileData: Partial<ProfileData>) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth(`/profiles/update?stx_address=${address}`, {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
            return data.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update user profile'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteUserProfile = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth(`/profiles/delete?stx_address=${address}`, {
                method: 'DELETE',
            });
            return data.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to delete user profile'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfileById = async (userId: number, profileData: Partial<ProfileData>) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth(`/profiles/admin/update?userId=${userId}`, {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
            return data.result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update user profile by ID'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        getUserProfile,
        getUserRole,
        createUserProfile,
        updateUserProfile,
        deleteUserProfile,
        updateUserProfileById,
        loading,
        error,
    };
}