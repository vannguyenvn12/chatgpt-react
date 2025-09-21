import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect } from 'react';
import theme from './theme';
import Form from './components/Form/Form';
import { useSocketContext } from './context/SocketProvider';

export default function App() {
  const { socket, connected } = useSocketContext();

  // Join default conversation khi socket kết nối
  useEffect(() => {
    if (socket && connected) {
      socket.emit('join_conversation', 'default');
    }
  }, [socket, connected]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* nền gradient nhẹ kiểu ChatGPT */}
      <Box
        sx={{
          minHeight: '100dvh',
          background:
            'radial-gradient(1200px 600px at 70% -10%, rgba(110,168,254,0.08) 0%, rgba(0,0,0,0) 60%)',
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: 1100,
            py: 6,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Form />
        </Container>
      </Box>
    </ThemeProvider>
  );
}
