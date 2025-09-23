import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
    if (!socket) {
        const socketUrl = import.meta.env.VITE_SOCKET_URL;
        console.log('🔧 Creating socket connection to:', socketUrl);

        socket = io(socketUrl, {
            path: '/ws',
            transports: ['websocket'],
            autoConnect: false,     // Không tự động kết nối, phải bấm nút
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            // Bỏ auth để giống chatgpt-inject
        });

        console.log('🔧 Socket created with config:', {
            url: socketUrl,
            path: '/ws',
            transports: ['websocket'],
            autoConnect: false
        });
    }
    return socket;
}
