// src/components/Chat/Chat.jsx
import { useCallback, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import { useSocketContext } from '../../context/SocketProvider';
import useSocket from '../../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function Chat() {
  const { socket, connected } = useSocketContext();
  // Local state for messages (no database) - chỉ giữ message mới nhất
  const [currentUserMessage, setCurrentUserMessage] = useState(null);
  const [latestChatGPTMessage, setLatestChatGPTMessage] = useState(null);
  const [isLoading] = useState(false);

  // Tạo array messages từ 2 state riêng biệt
  const messages = useMemo(() => {
    const msgs = [];
    if (currentUserMessage) msgs.push(currentUserMessage);
    if (latestChatGPTMessage) msgs.push(latestChatGPTMessage);
    return msgs;
  }, [currentUserMessage, latestChatGPTMessage]);

  const connectionChip = useMemo(
    () => (
      <Chip
        label={connected ? 'Connected' : 'Disconnected'}
        color={connected ? 'success' : 'default'}
        size='small'
      />
    ),
    [connected]
  );

  // Realtime: nhận tin nhắn server -> chỉ giữ message mới nhất
  useSocket('send_chat_to_react', (payload) => {
    const role =
      (payload?.role?.toLowerCase?.() ||
        (payload?.author || '').toLowerCase()) === 'you'
        ? 'you'
        : (payload?.author || '').toLowerCase() === 'vangpt'
        ? 'vangpt'
        : 'chatgpt';

    const msg = {
      _id: payload?.messageId || `sock_${payload?.ts || Date.now()}`,
      role,
      content: String(payload?.text ?? '').trim(),
      createdAt: new Date(payload?.ts || Date.now()).toISOString(),
    };

    if (!msg.content) return;

    // Chỉ giữ message mới nhất theo role
    if (role === 'you') {
      setCurrentUserMessage(msg);
    } else if (role === 'chatgpt') {
      setLatestChatGPTMessage(msg);
    }
  });

  // Gửi tin nhắn: emit socket tới server
  const handleSend = useCallback(
    (text) => {
      const room = 'default';
      const content = String(text || '').trim();

      if (!content || !connected) return;

      const tmpId = `tmp_${Date.now()}`;
      const payload = {
        room,
        type: 'chat:text',
        messageId: tmpId,
        text: content,
        author: 'you',
        ts: Date.now(),
        conversationId: room,
      };

      // Emit message via socket to server
      socket.emit('send_message_to_server', payload);
    },
    [socket, connected]
  );

  return (
    <Card
      variant='outlined'
      sx={{
        flex: 1,
        mx: 'auto',
        maxWidth: 1100,
        borderColor: 'divider',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        backdropFilter: 'saturate(110%) blur(10px)',
      }}
    >
      <CardHeader title='Văn GPT' action={connectionChip} sx={{ pb: 0.5 }} />
      <CardContent sx={{ pt: 2 }}>
        <MessageList
          items={messages}
          currentUser='you'
          height={560}
          isLoading={isLoading}
          hasNextPage={false}
          onLoadMore={() => {}}
          loadingMore={false}
        />
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <MessageInput onSend={handleSend} />
      </CardActions>
    </Card>
  );
}
