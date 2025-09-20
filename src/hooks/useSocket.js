import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketProvider';

/**
 * Lắng nghe sự kiện socket và tự gỡ khi unmount
 */
export default function useSocket(event, handler) {
    const { socket } = useSocketContext();

    useEffect(() => {
        if (!socket) return;
        socket.on(event, handler);
        return () => socket.off(event, handler);
    }, [socket, event, handler]);
}
