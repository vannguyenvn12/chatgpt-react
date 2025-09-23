// Test Socket.IO connection directly
const { io } = require('socket.io-client');

const API_URL = 'https://api-ai.vannguyenv12.com';

console.log('🔍 Testing Socket.IO connection to:', API_URL);

const socket = io(API_URL, {
    path: '/ws',
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
});

socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    console.log('Transport:', socket.io.engine.transport.name);

    // Test request_connect
    setTimeout(() => {
        console.log('📤 Sending request_connect...');
        socket.emit('request_connect', { userId: 'test_user_' + Date.now() });
    }, 1000);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.error('Error type:', error.type);
    console.error('Error description:', error.description);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
});

socket.on('socket_connected', (data) => {
    console.log('🎉 Socket management connected:', data);
});

socket.on('socket_error', (data) => {
    console.error('⚠️ Socket management error:', data);
});

socket.on('socket_occupied', (data) => {
    console.log('🚫 Socket occupied:', data);
});

socket.on('socket_available', (data) => {
    console.log('✅ Socket available:', data);
});

socket.on('pong', () => {
    console.log('🏓 Pong received');
});

// Test ping after 2 seconds
setTimeout(() => {
    if (socket.connected) {
        console.log('📤 Sending ping...');
        socket.emit('ping');
    }
}, 2000);

// Cleanup after 10 seconds
setTimeout(() => {
    console.log('🧹 Cleaning up...');
    socket.disconnect();
    process.exit(0);
}, 10000);
