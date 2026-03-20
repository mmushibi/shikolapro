// Real-time Data Service for Shikola Pro Registry
class RealTimeDataService {
    constructor() {
        this.eventSource = null;
        this.subscribers = new Map();
        this.cache = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // Initialize connection
        this.connect();
        
        // Listen for storage events for cross-tab communication
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    connect() {
        try {
            // Close existing connection
            if (this.eventSource) {
                this.eventSource.close();
            }
            
            // Create new EventSource connection
            this.eventSource = new EventSource('/api/realtime');
            
            this.eventSource.onopen = () => {
                console.log('Real-time connection established');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeUpdate(data);
                } catch (error) {
                    console.error('Error parsing real-time update:', error);
                }
            };
            
            this.eventSource.onerror = () => {
                console.error('Real-time connection error');
                this.handleReconnect();
            };
            
        } catch (error) {
            console.error('Failed to establish real-time connection:', error);
            // Fallback to polling
            this.startPolling();
        }
    }
    
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectDelay);
            this.reconnectDelay *= 2; // Exponential backoff
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            this.startPolling();
        }
    }
    
    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000); // Poll every 30 seconds
    }
    
    async checkForUpdates() {
        const entities = ['admissions', 'certificates', 'courses', 'grades', 'enrollments', 'transcripts', 'reports', 'settings'];
        
        for (const entity of entities) {
            try {
                const response = await fetch(`/api/data/${entity}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const cachedData = this.cache.get(entity);
                    
                    // Check if data has changed
                    if (JSON.stringify(data) !== JSON.stringify(cachedData)) {
                        this.cache.set(entity, data);
                        this.notifySubscribers(entity, {
                            type: 'update',
                            entity,
                            data
                        });
                    }
                }
            } catch (error) {
                console.error(`Error checking updates for ${entity}:`, error);
            }
        }
    }
    
    handleRealtimeUpdate(data) {
        const { type, entity, action, payload } = data;
        
        // Update cache
        if (type === 'data_update') {
            const cachedData = this.cache.get(entity) || [];
            
            switch (action) {
                case 'create':
                    cachedData.unshift(payload);
                    break;
                case 'update':
                    const index = cachedData.findIndex(item => item.id === payload.id);
                    if (index !== -1) {
                        cachedData[index] = payload;
                    }
                    break;
                case 'delete':
                    const deleteIndex = cachedData.findIndex(item => item.id === payload.id);
                    if (deleteIndex !== -1) {
                        cachedData.splice(deleteIndex, 1);
                    }
                    break;
            }
            
            this.cache.set(entity, cachedData);
        }
        
        // Notify all subscribers
        this.notifySubscribers(entity, data);
        
        // Also notify for cross-tab communication
        localStorage.setItem(`shikola_update_${entity}`, JSON.stringify(data));
        setTimeout(() => {
            localStorage.removeItem(`shikola_update_${entity}`);
        }, 100);
    }
    
    handleStorageEvent(event) {
        if (event.key && event.key.startsWith('shikola_update_')) {
            const entity = event.key.replace('shikola_update_', '');
            try {
                const data = JSON.parse(event.newValue);
                this.notifySubscribers(entity, data);
            } catch (error) {
                console.error('Error parsing storage event:', error);
            }
        }
    }
    
    handleVisibilityChange() {
        if (!document.hidden) {
            // Page became visible, check for updates
            this.checkForUpdates();
        }
    }
    
    subscribe(entity, callback) {
        if (!this.subscribers.has(entity)) {
            this.subscribers.set(entity, new Set());
        }
        
        this.subscribers.get(entity).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(entity);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscribers.delete(entity);
                }
            }
        };
    }
    
    notifySubscribers(entity, data) {
        const callbacks = this.subscribers.get(entity);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }
    
    async getData(entity) {
        // Return cached data if available
        if (this.cache.has(entity)) {
            return this.cache.get(entity);
        }
        
        // Fetch data if not cached
        try {
            const response = await fetch(`/api/data/${entity}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.cache.set(entity, data);
                return data;
            }
        } catch (error) {
            console.error(`Error fetching ${entity}:`, error);
        }
        
        return [];
    }
    
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        window.removeEventListener('storage', this.handleStorageEvent);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Global instance
window.realtimeService = new RealTimeDataService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeDataService;
}
