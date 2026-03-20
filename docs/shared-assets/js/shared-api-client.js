// Shared API Client for Shikola Pro
console.log('Shared API Client loaded');

window.sharedApiClient = {
    baseUrl: 'http://localhost:3000/api',
    token: null,
    
    init: function() {
        console.log('API client initialized');
        this.loadToken();
    },
    
    loadToken: function() {
        this.token = localStorage.getItem('authToken');
    },
    
    setToken: function(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    },
    
    clearToken: function() {
        this.token = null;
        localStorage.removeItem('authToken');
    },
    
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    },
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };
        
        try {
            console.log(`${config.method || 'GET'} request to:`, url);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },
    
    get: function(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post: function(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put: function(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: function(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // Authentication methods
    async login(email, password) {
        try {
            const response = await this.post('/auth/login', { email, password });
            this.setToken(response.token);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    async logout() {
        try {
            await this.post('/auth/logout');
            this.clearToken();
            return true;
        } catch (error) {
            this.clearToken();
            throw error;
        }
    },
    
    async getCurrentUser() {
        return this.get('/auth/me');
    },
    
    // User management methods
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/users${queryString ? '?' + queryString : ''}`);
    },
    
    async createUser(userData) {
        return this.post('/users', userData);
    },
    
    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    },
    
    async deleteUser(userId) {
        return this.delete(`/users/${userId}`);
    },
    
    // Generic data methods
    async getData(entity, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/data/${entity}${queryString ? '?' + queryString : ''}`);
    },
    
    async createData(entity, data) {
        return this.post(`/data/${entity}`, data);
    },
    
    async updateData(entity, id, data) {
        return this.put(`/data/${entity}/${id}`, data);
    },
    
    async deleteData(entity, id) {
        return this.delete(`/data/${entity}/${id}`);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.sharedApiClient.init();
});
