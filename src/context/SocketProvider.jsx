import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSocket } from '../api/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [socketError, setSocketError] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState('');
    const [userId] = useState(() => 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
    const socket = useMemo(() => getSocket(), []);

    useEffect(() => {
        // đăng ký sự kiện
        const onConnect = () => {
            console.log('🔌 Socket connected successfully:', socket.id);
            console.log('🔌 Socket transport:', socket.io.engine.transport.name);
            setConnected(true);
            setConnecting(false);
            setSocketError('');
        };
        const onDisconnect = () => {
            setConnected(false);
            setConnecting(false);
            setSocketError('');
        };
        const onConnectError = (error) => {
            console.error('❌ Socket connection error:', error);
            setConnecting(false);
        };

        // Socket management events
        const onSocketConnected = (data) => {
            console.log('🎉 Socket management connected:', data);
            setConnected(true);
            setConnecting(false);
            setSocketError('');
            setIsWaiting(false);
            setWaitingMessage('');
        };

        const onSocketDisconnected = (data) => {
            setConnected(false);
            setConnecting(false);
            setSocketError('');
            setIsWaiting(false);
            setWaitingMessage('');
        };

        const onSocketError = (data) => {
            console.error('⚠️ Socket management error:', data);
            setConnecting(false);
            setSocketError(data.message);
            if (data.conflict) {
                setIsWaiting(true);
                setWaitingMessage(data.message);
            }
        };

        const onSocketOccupied = (data) => {
            console.log('🚫 Socket occupied:', data);
            setIsWaiting(true);
            setWaitingMessage(data.message);
            setConnected(false);
            setConnecting(false);
        };

        const onSocketAvailable = (data) => {
            console.log('✅ Socket available:', data);
            setIsWaiting(false);
            setWaitingMessage('');
            setSocketError('');
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('socket_connected', onSocketConnected);
        socket.on('socket_disconnected', onSocketDisconnected);
        socket.on('socket_error', onSocketError);
        socket.on('socket_occupied', onSocketOccupied);
        socket.on('socket_available', onSocketAvailable);

        // Không tự động kết nối, chờ người dùng bấm nút
        console.log('🔌 Socket created but not connected, waiting for user to click connect button');

        // cleanup
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('socket_connected', onSocketConnected);
            socket.off('socket_disconnected', onSocketDisconnected);
            socket.off('socket_error', onSocketError);
            socket.off('socket_occupied', onSocketOccupied);
            socket.off('socket_available', onSocketAvailable);
        };
    }, [socket]);

    const connectSocket = () => {
        if (!socket.connected && !connecting) {
            console.log('🚀 User clicked connect button, attempting to connect socket...');
            setConnecting(true);
            setSocketError('');
            socket.connect();
            // Sau khi connect thành công, request socket access
            setTimeout(() => {
                if (socket.connected) {
                    console.log('📤 Sending request_connect for user:', userId);
                    socket.emit('request_connect', { userId });
                } else {
                    console.log('❌ Socket not connected, cannot send request_connect');
                }
            }, 1000); // Tăng timeout để đảm bảo kết nối ổn định
        } else {
            console.log('⚠️ Socket already connected or connecting');
        }
    };

    const disconnectSocket = () => {
        if (socket.connected) {
            console.log('🔌 Disconnecting socket for user:', userId);
            socket.emit('request_disconnect', { userId });
            socket.disconnect();
        } else {
            console.log('⚠️ Socket not connected, cannot disconnect');
        }
    };

    const value = useMemo(() => ({
        socket,
        connected,
        connecting,
        socketError,
        isWaiting,
        waitingMessage,
        connectSocket,
        disconnectSocket
    }), [socket, connected, connecting, socketError, isWaiting, waitingMessage]);

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocketContext must be used within <SocketProvider>');
    return ctx;
}
