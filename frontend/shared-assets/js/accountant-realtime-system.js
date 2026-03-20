// Accountant Real-time Data System for Shikola Pro
console.log('Accountant Real-time System loaded');

window.accountantRealtimeSystem = {
    // WebSocket connection for real-time updates
    websocket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: 5000,
    
    // Local storage event listeners
    storageListeners: new Map(),
    
    // Real-time subscribers
    subscribers: new Map(),
    
    // Data cache for performance
    dataCache: new Map(),
    
    // Initialize the real-time system
    init: function() {
        console.log('Accountant Real-time System initialized');
        this.setupStorageListeners();
        this.setupWebSocketConnection();
        this.setupPeriodicSync();
    },

    // Setup WebSocket connection for real-time updates
    setupWebSocketConnection: function() {
        if (typeof WebSocket === 'undefined') {
            console.log('WebSocket not supported, using polling fallback');
            return;
        }

        try {
            const wsUrl = this.getWebSocketUrl();
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected for real-time updates');
                this.reconnectAttempts = 0;
                this.sendHeartbeat();
            };
            
            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.websocket.onclose = () => {
                console.log('WebSocket disconnected, attempting to reconnect...');
                this.attemptReconnect();
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            this.setupPollingFallback();
        }
    },

    // Get WebSocket URL
    getWebSocketUrl: function() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws/accountant`;
    },

    // Handle WebSocket messages
    handleWebSocketMessage: function(event) {
        try {
            const data = JSON.parse(event.data);
            this.processRealtimeUpdate(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    },

    // Process real-time updates
    processRealtimeUpdate: function(data) {
        const { type, action, payload, timestamp } = data;
        
        console.log(`Real-time update: ${action} on ${type}`);
        
        // Update local cache
        this.updateDataCache(type, payload);
        
        // Update localStorage
        if (window.accountantSavingSystem) {
            accountantSavingSystem.saveData(type, payload);
        }
        
        // Notify subscribers
        this.notifySubscribers(type, action, payload);
        
        // Update UI components
        this.updateUIComponents(type, action, payload);
    },

    // Setup storage event listeners for cross-tab communication
    setupStorageListeners: function() {
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('accountant_')) {
                const type = event.key.replace('accountant_', '');
                const newValue = event.newValue ? JSON.parse(event.newValue) : null;
                const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
                
                this.handleStorageChange(type, newValue, oldValue);
            }
        });
    },

    // Handle storage changes from other tabs
    handleStorageChange: function(type, newValue, oldValue) {
        console.log(`Storage change detected for ${type}`);
        
        // Update cache
        this.dataCache.set(type, newValue);
        
        // Determine action
        let action = 'update';
        if (!newValue && oldValue) {
            action = 'delete';
        } else if (newValue && !oldValue) {
            action = 'create';
        }
        
        // Notify subscribers
        this.notifySubscribers(type, action, newValue);
        
        // Update UI
        this.updateUIComponents(type, action, newValue);
    },

    // Subscribe to real-time updates for specific data type
    subscribe: function(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        this.subscribers.get(type).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(type);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscribers.delete(type);
                }
            }
        };
    },

    // Notify all subscribers of data changes
    notifySubscribers: function(type, action, data) {
        const callbacks = this.subscribers.get(type);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({ type, action, data, timestamp: Date.now() });
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    },

    // Update data cache
    updateDataCache: function(type, data) {
        this.dataCache.set(type, data);
    },

    // Get cached data or fetch from storage
    getData: function(type) {
        if (this.dataCache.has(type)) {
            return this.dataCache.get(type);
        }
        
        // Fetch from localStorage if not in cache
        if (window.accountantSavingSystem) {
            const data = accountantSavingSystem.getData(type);
            this.dataCache.set(type, data);
            return data;
        }
        
        return [];
    },

    // Real-time data fetch with caching
    fetchRealtimeData: function(type, forceRefresh = false) {
        return new Promise((resolve, reject) => {
            // Return cached data if available and not forcing refresh
            if (!forceRefresh && this.dataCache.has(type)) {
                resolve(this.dataCache.get(type));
                return;
            }
            
            // Fetch from API if available
            if (window.sharedApiClient) {
                sharedApiClient.request(`/accountant/${type}`)
                    .then(data => {
                        this.updateDataCache(type, data);
                        resolve(data);
                    })
                    .catch(error => {
                        console.error('Error fetching realtime data:', error);
                        // Fallback to localStorage
                        if (window.accountantSavingSystem) {
                            const localData = accountantSavingSystem.getData(type);
                            this.updateDataCache(type, localData);
                            resolve(localData);
                        } else {
                            reject(error);
                        }
                    });
            } else {
                // Fallback to localStorage
                if (window.accountantSavingSystem) {
                    const data = accountantSavingSystem.getData(type);
                    this.updateDataCache(type, data);
                    resolve(data);
                } else {
                    reject(new Error('No data source available'));
                }
            }
        });
    },

    // Broadcast data changes to all connected clients
    broadcastChange: function(type, action, data) {
        const message = {
            type,
            action,
            payload: data,
            timestamp: Date.now(),
            source: 'accountant'
        };
        
        // Send via WebSocket if connected
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
        
        // Update local storage to trigger cross-tab updates
        if (window.accountantSavingSystem) {
            accountantSavingSystem.saveData(type, data);
        }
        
        // Update cache
        this.updateDataCache(type, data);
        
        // Notify local subscribers
        this.notifySubscribers(type, action, data);
    },

    // Update UI components across all pages
    updateUIComponents: function(type, action, data) {
        // Update dashboard stats
        this.updateDashboardStats(type, action, data);
        
        // Update charts and visualizations
        this.updateCharts(type, action, data);
        
        // Update tables and lists
        this.updateTables(type, action, data);
        
        // Update notifications
        this.updateNotifications(type, action, data);
    },

    // Update dashboard statistics
    updateDashboardStats: function(type, action, data) {
        // This would be implemented by each specific page
        // Trigger custom events that pages can listen for
        window.dispatchEvent(new CustomEvent('accountant-stats-update', {
            detail: { type, action, data }
        }));
    },

    // Update charts
    updateCharts: function(type, action, data) {
        window.dispatchEvent(new CustomEvent('accountant-chart-update', {
            detail: { type, action, data }
        }));
    },

    // Update tables
    updateTables: function(type, action, data) {
        window.dispatchEvent(new CustomEvent('accountant-table-update', {
            detail: { type, action, data }
        }));
    },

    // Update notifications
    updateNotifications: function(type, action, data) {
        window.dispatchEvent(new CustomEvent('accountant-notification', {
            detail: { 
                type, 
                action, 
                data,
                message: this.generateNotificationMessage(type, action, data)
            }
        }));
    },

    // Generate notification messages
    generateNotificationMessage: function(type, action, data) {
        const messages = {
            fees: {
                create: `New fee collection recorded: ZMW ${data.amount || 0}`,
                update: `Fee collection updated: ZMW ${data.amount || 0}`,
                delete: 'Fee collection deleted'
            },
            expenses: {
                create: `New expense added: ZMW ${data.amount || 0}`,
                update: `Expense updated: ZMW ${data.amount || 0}`,
                delete: 'Expense deleted'
            },
            invoices: {
                create: `New invoice created: ${data.invoiceNumber || 'Unknown'}`,
                update: `Invoice updated: ${data.invoiceNumber || 'Unknown'}`,
                delete: 'Invoice deleted'
            },
            payroll: {
                create: `New payroll entry added: ZMW ${data.amount || 0}`,
                update: `Payroll updated: ZMW ${data.amount || 0}`,
                delete: 'Payroll entry deleted'
            }
        };
        
        return messages[type]?.[action] || `${type} ${action} operation completed`;
    },

    // Attempt to reconnect WebSocket
    attemptReconnect: function() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.setupWebSocketConnection();
            }, this.reconnectInterval);
        } else {
            console.log('Max reconnection attempts reached, switching to polling');
            this.setupPollingFallback();
        }
    },

    // Setup polling fallback when WebSocket fails
    setupPollingFallback: function() {
        console.log('Setting up polling fallback for real-time updates');
        
        setInterval(() => {
            this.pollForUpdates();
        }, 30000); // Poll every 30 seconds
    },

    // Poll for updates
    pollForUpdates: function() {
        if (window.sharedApiClient) {
            ['fees', 'expenses', 'invoices', 'payroll', 'budget'].forEach(type => {
                this.fetchRealtimeData(type, true)
                    .catch(error => {
                        console.error(`Error polling ${type}:`, error);
                    });
            });
        }
    },

    // Setup periodic sync
    setupPeriodicSync: function() {
        // Sync every 5 minutes
        setInterval(() => {
            this.performPeriodicSync();
        }, 300000);
    },

    // Perform periodic sync
    performPeriodicSync: function() {
        console.log('Performing periodic data sync');
        
        ['fees', 'expenses', 'invoices', 'payroll', 'budget', 'studentFees'].forEach(type => {
            this.fetchRealtimeData(type, true)
                .catch(error => {
                    console.error(`Error syncing ${type}:`, error);
                });
        });
    },

    // Send heartbeat to keep WebSocket alive
    sendHeartbeat: function() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        }
    },

    // Cleanup resources
    cleanup: function() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.subscribers.clear();
        this.dataCache.clear();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    accountantRealtimeSystem.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    accountantRealtimeSystem.cleanup();
});
