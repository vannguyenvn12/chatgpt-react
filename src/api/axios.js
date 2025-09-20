import axios from 'axios';

// baseURL lấy từ env
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true, // nếu dùng cookie
    timeout: 15000,
});

// Thêm interceptors request
api.interceptors.request.use(
    (config) => {
        // ví dụ: gắn token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Thêm interceptors response
api.interceptors.response.use(
    (res) => res.data, // lấy data trực tiếp
    (error) => {
        console.error('API error:', error);
        return Promise.reject(error);
    }
);

export default api;
