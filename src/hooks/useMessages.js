import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listMessagesApi,
    createMessageApi,
    updateMessageApi,
    deleteMessageApi,
    clearMessagesApi,
} from '../api/messages';

/** Chat thân thiện: dùng infinite query, order mặc định 'asc' (cũ -> mới) */
export function useMessages(conversationId, { limit = 50, order = 'asc' } = {}) {
    return useInfiniteQuery({
        queryKey: ['messages', conversationId, { limit, order }],
        enabled: !!conversationId,
        queryFn: ({ pageParam = 1 }) => listMessagesApi(conversationId, { page: pageParam, limit, order }),
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
        staleTime: 5_000,
    });
}

export function useSendMessage(conversationId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => createMessageApi(conversationId, payload),
        onSuccess: () => {
            // đơn giản: refetch thay vì merge thủ công
            console.log('add you message success');
            qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });
}

export function useUpdateMessage(conversationId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, patch }) => updateMessageApi(id, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });
}

export function useDeleteMessage(conversationId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteMessageApi(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });
}

export function useClearMessages(conversationId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => clearMessagesApi(conversationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });
}
