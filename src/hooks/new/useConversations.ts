import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/helpers/fetchWithAuth';

export interface Conversation {
    id: number;
    profile_id: string;
    conversation_name: string;
    created_at: string;
    updated_at: string;
}

export interface ConversationHistory {
    id: number;
    conversation_id: number;
    message: string;
    created_at: string;
}

export function useConversations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const profileId = localStorage.getItem('stxAddress');

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

    const getConversations = useCallback(() =>
        handleRequest<Conversation[]>(
            fetchWithAuth(`/conversations?address=${profileId}`).then(res => res.conversations),
            'Failed to fetch conversations'
        ),
        [handleRequest, profileId]
    );

    const getLatestConversation = useCallback(() =>
        handleRequest<Conversation>(
            fetchWithAuth(`/conversations/latest?address=${profileId}`).then(res => res.conversation),
            'Failed to fetch latest conversation'
        ),
        [handleRequest, profileId]
    );

    const getConversationHistory = useCallback((conversationId: number) =>
        handleRequest<ConversationHistory[]>(
            fetchWithAuth(`/conversations/history?id=${conversationId}`).then(res => res.history),
            'Failed to fetch conversation history'
        ),
        [handleRequest]
    );

    const createConversation = useCallback((conversation_name?: string) =>
        handleRequest<Conversation>(
            fetchWithAuth('/conversations/create', {
                method: 'POST',
                body: JSON.stringify({ profile_id: profileId, conversation_name }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.result),
            'Failed to create conversation'
        ),
        [handleRequest, profileId]
    );

    return {
        loading,
        error,
        getConversations,
        getLatestConversation,
        getConversationHistory,
        createConversation,
    };
}