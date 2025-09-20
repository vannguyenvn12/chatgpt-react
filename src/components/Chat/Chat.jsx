// src/components/Chat/Chat.jsx
import { useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardActions, Chip } from '@mui/material';
import { useSocketContext } from '../../context/SocketProvider';
import useSocket from '../../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useParams } from 'react-router-dom';
import { useSendMessage, useMessages } from '../../hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';

export default function Chat() {
    const { id: conversationId } = useParams(); // /chat/:id
    const { socket, connected } = useSocketContext();
    const qc = useQueryClient();

    // messages từ React Query (infinite)
    const LIMIT = 30;
    const ORDER = 'asc'; // cũ -> mới
    const key = ['messages', conversationId, { limit: LIMIT, order: ORDER }];

    const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useMessages(conversationId, { limit: LIMIT, order: ORDER });


    const sendMutation = useSendMessage(conversationId);

    const messages = useMemo(
        () => data?.pages?.flatMap((p) => p.items) ?? [],
        [data]
    );

    console.log('messages', messages);


    // Helpers: ghi cache để push/replace message
    const pushToCache = useCallback((msg) => {
        qc.setQueryData(key, (prev) => {
            if (!prev) {
                // khởi tạo cấu trúc tối thiểu cho infinite query
                return {
                    pages: [{ items: [msg], page: 1, limit: LIMIT, total: 1, totalPages: 1 }],
                    pageParams: [1],
                };
            }
            const pages = [...prev.pages];
            const last = pages[pages.length - 1];
            pages[pages.length - 1] = {
                ...last,
                items: [...(last?.items ?? []), msg],
                total: (last?.total ?? 0) + 1,
            };
            return { ...prev, pages };
        });
    }, [qc, key]);

    const replaceInCache = useCallback((predicate, replacer) => {
        qc.setQueryData(key, (prev) => {
            if (!prev) return prev;
            const pages = prev.pages.map((pg) => ({
                ...pg,
                items: pg.items.map((m) => (predicate(m) ? replacer(m) : m)),
            }));
            return { ...prev, pages };
        });
    }, [qc, key]);

    const connectionChip = useMemo(
        () => <Chip label={connected ? 'Connected' : 'Disconnected'} color={connected ? 'success' : 'default'} size="small" />,
        [connected]
    );

    // Realtime: nhận tin nhắn server -> convert về shape Message và push vào cache
    useSocket('send_chat_to_react', (payload) => {

        console.log('send_chat_to_react', payload);

        // payload có thể dạng: { room/conversationId, text, author, messageId, ts }
        const role = (payload?.role?.toLowerCase?.() ||
            (payload?.author || '').toLowerCase()) === 'you'
            ? 'you'
            : (payload?.author || '').toLowerCase() === 'vangpt' ? 'vangpt' : 'chatgpt';

        const msg = {
            _id: payload?.messageId || `sock_${payload?.ts || Date.now()}`,
            conversation: String(payload?.conversationId || payload?.room || conversationId || ''),
            role,
            content: String(payload?.text ?? '').trim(),
            createdAt: new Date(payload?.ts || Date.now()).toISOString(),
        };

        if (!msg.conversation || msg.conversation !== String(conversationId || '')) return;
        if (!msg.content) return;

        pushToCache(msg);
    });

    // Gửi tin nhắn: optimistic + lưu DB + emit socket (theo room)
    const handleSend = useCallback((text) => {
        const room = String(conversationId || '');
        const content = String(text || '').trim();
        if (!room || !content) return;

        const tmpId = `tmp_${Date.now()}`;
        const optimisticMsg = {
            _id: tmpId,
            conversation: room,
            role: 'you',
            content,
            createdAt: new Date().toISOString(),
            pending: true,
        };
        pushToCache(optimisticMsg);

        sendMutation.mutate(
            { role: 'you', content },
            {
                onSuccess: (savedMsg) => {
                    // thay temp -> saved
                    // replaceInCache(
                    //     (m) => m._id === tmpId,
                    //     () => ({ ...savedMsg, pending: false })
                    // );

                    console.log('savedMsg', savedMsg)

                    // Emit qua socket theo ROOM (kèm ack)
                    // socket.emit(
                    //     'send_message_to_server',
                    //     {
                    //         room,
                    //         type: 'chat:text',
                    //         messageId: savedMsg._id,
                    //         text: content,
                    //         author: 'you',
                    //         ts: Date.now(),
                    //     },
                    //     (ack) => {
                    //         if (!ack?.ok) {
                    //             // đánh dấu lỗi socket (không xoá nội dung user)
                    //             replaceInCache(
                    //                 (m) => m._id === savedMsg._id,
                    //                 (m) => ({ ...m, socketError: ack?.error || 'socket_failed' })
                    //             );
                    //         }
                    //     }
                    // );

                    qc.invalidateQueries(key);
                },
                onError: () => {
                    // xoá temp khi API fail
                    // replaceInCache(
                    //     (m) => m._id === tmpId,
                    //     () => null
                    // );
                    // // dọn null entries nếu có
                    // qc.setQueryData(key, (prev) => {
                    //     if (!prev) return prev;
                    //     const pages = prev.pages.map((pg) => ({ ...pg, items: pg.items.filter(Boolean) }));
                    //     return { ...prev, pages };
                    // });
                },
            }
        );
    }, [conversationId, socket, sendMutation, pushToCache, replaceInCache, qc, key]);

    return (
        <Card
            variant="outlined"
            sx={{
                flex: 1,
                mx: 'auto',
                maxWidth: 1100,
                borderColor: 'divider',
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
                backdropFilter: 'saturate(110%) blur(10px)',
            }}
        >
            <CardHeader title="Văn GPT" action={connectionChip} sx={{ pb: 0.5 }} />
            <CardContent sx={{ pt: 2 }}>
                <MessageList
                    items={messages}
                    currentUser="you"
                    height={560}
                    isLoading={isLoading}
                    hasNextPage={hasNextPage}
                    onLoadMore={() => fetchNextPage()}
                    loadingMore={isFetchingNextPage}
                />
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
                <MessageInput onSend={handleSend} />
            </CardActions>
        </Card>
    );
}
