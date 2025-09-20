import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSocket } from '../api/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const socket = useMemo(() => getSocket(), []);

    useEffect(() => {
        // đăng ký sự kiện
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // chủ động kết nối
        if (!socket.connected) socket.connect();

        // cleanup
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            // Không disconnect ở đây nếu muốn giữ kết nối khi rời trang con
            // socket.disconnect();
        };
    }, [socket]);

    const value = useMemo(() => ({ socket, connected }), [socket, connected]);

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocketContext must be used within <SocketProvider>');
    return ctx;
}
