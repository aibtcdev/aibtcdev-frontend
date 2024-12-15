import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export function useConversations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getConversations = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const { conversations } = await fetchWithAuth(`/conversations?address=${address}`);
            return conversations;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getLatestConversation = async (address: string) => {
        setLoading(true);
        setError(null);
        try {
            const { conversation } = await fetchWithAuth(`/conversations/latest?address=${address}`);
            return conversation;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getConversationHistory = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const { history } = await fetchWithAuth(`/conversations/history?id=${id}`);
            return history;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { getConversations, getLatestConversation, getConversationHistory, loading, error };
}