import { useState } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';


export function useConversations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getConversations = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/conversations');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getLatestConversation = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/conversations/latest');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getConversationHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            return await fetchWithAuth('/conversations/history');
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { getConversations, getLatestConversation, getConversationHistory, loading, error };
}
