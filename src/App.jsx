import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme';
import Chat from './components/Chat/Chat';
import Sidebar from './components/Sidebar/Sidebar';
import { useEffect, useState } from 'react';
import AddConversationDialog from './components/Modal/AddConversationDialog';
import { useQuery } from '@tanstack/react-query';
import { listConversationsApi } from './api/conversations';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocketContext } from './context/SocketProvider';

export default function App() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams();

  const { socket, connected } = useSocketContext();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => listConversationsApi({ limit: 100 }),
  });
  const conversations = data ?? [];

  const [activeId, setActiveId] = useState(conversationId || null);
  const [openAdd, setOpenAdd] = useState(false);

  // Khi đã có data mà chưa có id trên URL => điều hướng tới cuộc trò chuyện đầu tiên
  useEffect(() => {
    if (!isLoading && activeId && socket) {
      navigate(`/chat/${activeId}`, { replace: true });
      socket.emit('join_conversation', activeId)
    }
  }, [isLoading, navigate, activeId, connected, socket]);



  // callback chọn conversation => chỉ cập nhật URL
  const handleSelectConversation = (c) => {
    navigate(`/chat/${c._id}`);
  };



  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* nền gradient nhẹ kiểu ChatGPT */}
      <Box
        sx={{
          minHeight: '100dvh',
          background: 'radial-gradient(1200px 600px at 70% -10%, rgba(110,168,254,0.08) 0%, rgba(0,0,0,0) 60%)',
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1100, py: 6, display: 'flex', gap: 1 }}>
          <Sidebar
            conversations={conversations}
            activeId={activeId}
            onNewChat={() => setOpenAdd(true)}
            onSelectConversation={(c) => setActiveId(c._id)}
          />
          <Chat />
        </Container>

        {/* Modal */}
        <AddConversationDialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onCreated={(c) => {
            setActiveId(c._id);
            // optional: điều hướng tới route chi tiết
            // navigate(`/chat/${c._id}`);
          }}
        />
      </Box>
    </ThemeProvider>
  );
}
