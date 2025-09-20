import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(import.meta.env.VITE_SOCKET_URL, {
            path: '/ws',            // khớp với server nếu bạn đổi
            transports: ['websocket'],
            autoConnect: false,     // chủ động connect trong Provider
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            auth: (cb) => cb({ token: 'optional-token' }),
        });
    }
    return socket;
}
