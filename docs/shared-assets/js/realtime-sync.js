// Real-time Data Sync System for Shikola Pro
console.log('Real-time Data Sync System loaded');

window.realTimeSync = {
    // WebSocket connection
    ws: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: 5000,
    
    // Event listeners
    listeners: {},
    
    // Initialize real-time sync
    init: function() {
        console.log('Initializing real-time data sync...');
        this.connect();
        
        // Listen for storage events from other tabs
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
        
        // Listen for online/offline events
        window.addEventListener('online', this.handleOnlineEvent.bind(this));
        window.addEventListener('offline', this.handleOfflineEvent.bind(this));
    },
    
    // Connect to WebSocket server
    connect: function() {
        try {
            const wsUrl = this.getWebSocketUrl();
            console.log('Connecting to WebSocket:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.fallbackToPolling();
        }
    },
    
    // Get WebSocket URL based on current environment
    getWebSocketUrl: function() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/api/hr/realtime`;
    },
    
    // Handle WebSocket open
    handleOpen: function() {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        
        // Request initial data sync
        this.sendMessage({
            type: 'sync_request',
            data: {
                timestamp: Date.now(),
                clientId: this.getClientId()
            }
        });
    },
    
    // Handle WebSocket messages
    handleMessage: function(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('Received real-time message:', message);
            
            switch (message.type) {
                case 'data_update':
                    this.handleDataUpdate(message.data);
                    break;
                case 'sync_response':
                    this.handleSyncResponse(message.data);
                    break;
                case 'heartbeat':
                    this.handleHeartbeat(message.data);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    },
    
    // Handle data updates from server
    handleDataUpdate: function(data) {
        const { type, action, payload } = data;
        
        console.log(`Real-time ${action} for ${type}:`, payload);
        
        // Update localStorage
        if (window.hrSavingSystem) {
            switch (action) {
                case 'create':
                case 'update':
                    this.updateOrCreateItem(type, payload);
                    break;
                case 'delete':
                    this.deleteItem(type, payload.id);
                    break;
            }
        }
        
        // Notify all listeners
        this.notifyListeners(type, action, payload);
    },
    
    // Update or create item in storage
    updateOrCreateItem: function(type, item) {
        if (!window.hrSavingSystem) return;
        
        const currentData = hrSavingSystem.getData(type);
        const existingIndex = currentData.findIndex(i => i.id === item.id);
        
        if (existingIndex !== -1) {
            currentData[existingIndex] = { ...currentData[existingIndex], ...item };
        } else {
            currentData.unshift(item);
        }
        
        hrSavingSystem.saveData(type, currentData);
    },
    
    // Delete item from storage
    deleteItem: function(type, itemId) {
        if (!window.hrSavingSystem) return;
        
        const currentData = hrSavingSystem.getData(type);
        const filteredData = currentData.filter(item => item.id !== itemId);
        hrSavingSystem.saveData(type, filteredData);
    },
    
    // Handle sync response
    handleSyncResponse: function(data) {
        console.log('Sync response received:', data);
        
        if (data.initialData) {
            // Update all data types with server data
            Object.keys(data.initialData).forEach(type => {
                if (window.hrSavingSystem) {
                    hrSavingSystem.saveData(type, data.initialData[type]);
                }
            });
        }
    },
    
    // Handle heartbeat
    handleHeartbeat: function(data) {
        // Respond to heartbeat
        this.sendMessage({
            type: 'heartbeat_response',
            data: { timestamp: Date.now() }
        });
    },
    
    // Handle WebSocket close
    handleClose: function(event) {
        console.log('WebSocket connection closed:', event);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            this.fallbackToPolling();
        }
    },
    
    // Handle WebSocket error
    handleError: function(error) {
        console.error('WebSocket error:', error);
    },
    
    // Fallback to HTTP polling
    fallbackToPolling: function() {
        console.log('Falling back to HTTP polling for real-time updates');
        setInterval(() => {
            this.pollForUpdates();
        }, 10000); // Poll every 10 seconds
    },
    
    // Poll for updates via HTTP
    pollForUpdates: function() {
        if (!window.sharedApiClient) return;
        
        const lastSync = localStorage.getItem('hr_last_sync') || 0;
        
        sharedApiClient.request('/hr/updates', {
            method: 'POST',
            body: JSON.stringify({ lastSync })
        })
        .then(response => response.json())
        .then(data => {
            if (data.updates && data.updates.length > 0) {
                data.updates.forEach(update => {
                    this.handleDataUpdate(update);
                });
                localStorage.setItem('hr_last_sync', Date.now().toString());
            }
        })
        .catch(error => {
            console.error('Polling error:', error);
        });
    },
    
    // Send message to WebSocket
    sendMessage: function(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.log('WebSocket not ready, queuing message');
            setTimeout(() => this.sendMessage(message), 1000);
        }
    },
    
    // Handle storage events (cross-tab sync)
    handleStorageEvent: function(event) {
        if (event.key && event.key.startsWith('hr_')) {
            const type = event.key.replace('hr_', '');
            const newValue = event.newValue ? JSON.parse(event.newValue) : null;
            
            this.notifyListeners(type, 'storage_change', {
                oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
                newValue: newValue
            });
        }
    },
    
    // Handle online event
    handleOnlineEvent: function() {
        console.log('Connection restored, attempting WebSocket reconnection');
        this.reconnectAttempts = 0;
        this.connect();
    },
    
    // Handle offline event
    handleOfflineEvent: function() {
        console.log('Connection lost, switching to offline mode');
        if (this.ws) {
            this.ws.close();
        }
    },
    
    // Add event listener
    addListener: function(type, callback) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
    },
    
    // Remove event listener
    removeListener: function(type, callback) {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
        }
    },
    
    // Notify all listeners
    notifyListeners: function(type, action, data) {
        if (this.listeners[type]) {
            this.listeners[type].forEach(callback => {
                try {
                    callback(action, data);
                } catch (error) {
                    console.error('Listener callback error:', error);
                }
            });
        }
    },
    
    // Get unique client ID
    getClientId: function() {
        let clientId = localStorage.getItem('hr_client_id');
        if (!clientId) {
            clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('hr_client_id', clientId);
        }
        return clientId;
    },
    
    // Broadcast local changes to server
    broadcastChange: function(type, action, data) {
        this.sendMessage({
            type: 'local_change',
            data: {
                type,
                action,
                data,
                timestamp: Date.now(),
                clientId: this.getClientId()
            }
        });
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    realTimeSync.init();
});
