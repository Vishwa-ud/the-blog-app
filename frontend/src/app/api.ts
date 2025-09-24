import axios from "axios";

// Force the correct base URL for development - HARDCODED FOR DEBUGGING
const BASE_URL = "https://localhost/api";  // Updated to use nginx HTTP API

console.log("🔧 API Base URL:", BASE_URL);
console.log("🔧 Environment:", import.meta.env.MODE);
console.log("🔧 All env vars:", import.meta.env);

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
});

// Add request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        console.log('🚀 API Request:', config.method?.toUpperCase(), (config.baseURL || '') + (config.url || ''));
        console.log('🚀 Full URL:', config.url);
        return config;
    },
    (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Response Error:', error.response?.status, error.config?.url);
        console.error('❌ Full error:', error);
        return Promise.reject(error);
    }
);
