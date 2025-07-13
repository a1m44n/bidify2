import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Use cookie-based authentication like the rest of the app
});

// Add a response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect to login for search endpoints that fail
        const isSearchEndpoint = error.config?.url && (
            error.config.url.includes('/search') || 
            error.config.url.includes('/suggestions')
        );
        
        // Only handle auth errors for non-search endpoints
        if (error.response?.status === 401 && !isSearchEndpoint) {
            // Let the AuthContext handle the logout
            console.error('Authentication failed');
        }
        
        return Promise.reject(error);
    }
);

export default api; 