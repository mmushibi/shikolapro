// Enhanced Real-time Data System for Shikola Pro
// Unified system for real-time data fetching and sharing across all modules
console.log('Enhanced Real-time System loaded');

window.enhancedRealtimeSystem = {
    // Connection management
    connections: {
        websocket: null,
        eventSource: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        isOnline: navigator.onLine
    },

    // Data management
    dataStore: new Map(),
    subscribers: new Map(),
    eventQueue: [],
    syncInProgress: new Set(),

    // Configuration
    config: {
        websocketUrl: null,
        apiEndpoints: {
            fees: '/api/fees',
            expenses: '/api/expenses',
            users: '/api/users',
            courses: '/api/courses',
            grades: '/api/grades',
            attendance: '/api/attendance',
            notifications: '/api/notifications',
            announcements: '/api/announcements',
            reports: '/api/reports'
        },
        syncIntervals: {
            fast: 5000,    // 5 seconds for critical data
            medium: 15000, // 15 seconds for regular data
            slow: 60000    // 1 minute for background data
        }
    },

    // Initialize the enhanced real-time system
    init: function() {
        console.log('Initializing Enhanced Real-time System...');
        this.setupConnectionUrls();
        this.setupNetworkListeners();
        this.setupStorageListeners();
        this.initializeConnections();
        this.setupPeriodicSync();
        this.setupServiceWorker();
    },

    // Setup connection URLs based on environment
    setupConnectionUrls: function() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.config.websocketUrl = `${protocol}//${host}/ws/enhanced`;
    },

    // Setup network status listeners
    setupNetworkListeners: function() {
        window.addEventListener('online', () => {
            console.log('Network connection restored');
            this.connections.isOnline = true;
            this.reconnectAll();
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost');
            this.connections.isOnline = false;
            this.notifySubscribers('network', {
                type: 'offline',
                message: 'Network connection lost. Some features may be unavailable.'
            });
        });
    },

    // Setup cross-tab communication
    setupStorageListeners: function() {
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('shikola_realtime_')) {
                const data = JSON.parse(event.newValue);
                this.handleCrossTabUpdate(data);
            }
        });
    },

    // Initialize primary connections
    initializeConnections: function() {
        this.initializeWebSocket();
        this.initializeEventSource();
    },

    // Initialize WebSocket connection
    initializeWebSocket: function() {
        if (typeof WebSocket === 'undefined') {
            console.log('WebSocket not supported, using EventSource fallback');
            this.initializeEventSource();
            return;
        }

        try {
            this.connections.websocket = new WebSocket(this.config.websocketUrl);
            
            this.connections.websocket.onopen = () => {
                console.log('Enhanced WebSocket connected');
                this.connections.reconnectAttempts = 0;
                this.sendInitialSync();
                this.processEventQueue();
            };

            this.connections.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.connections.websocket.onclose = () => {
                console.log('Enhanced WebSocket disconnected');
                this.attemptReconnect();
            };

            this.connections.websocket.onerror = (error) => {
                console.error('Enhanced WebSocket error:', error);
                this.handleConnectionError(error);
            };

        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.initializeEventSource();
        }
    },

    // Initialize EventSource connection
    initializeEventSource: function() {
        try {
            this.connections.eventSource = new EventSource('/api/realtime/enhanced');
            
            this.connections.eventSource.onopen = () => {
                console.log('Enhanced EventSource connected');
                this.connections.reconnectAttempts = 0;
            };

            this.connections.eventSource.onmessage = (event) => {
                this.handleEventSourceMessage(event);
            };

            this.connections.eventSource.onerror = (error) => {
                console.error('Enhanced EventSource error:', error);
                this.handleConnectionError(error);
            };

        } catch (error) {
            console.error('Failed to initialize EventSource:', error);
            this.setupPollingFallback();
        }
    },

    // Setup polling fallback
    setupPollingFallback: function() {
        console.log('Setting up enhanced polling fallback');
        setInterval(() => {
            this.performPollingSync();
        }, this.config.syncIntervals.medium);
    },

    // Setup Service Worker for background sync
    setupServiceWorker: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered for background sync');
                    this.setupServiceWorkerMessages(registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    },

    // Setup Service Worker message handling
    setupServiceWorkerMessages: function(registration) {
        if (registration.active) {
            registration.active.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });
        }
    },

    // Handle WebSocket messages
    handleWebSocketMessage: function(event) {
        try {
            const data = JSON.parse(event.data);
            this.processRealtimeData(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    },

    // Handle EventSource messages
    handleEventSourceMessage: function(event) {
        try {
            const data = JSON.parse(event.data);
            this.processRealtimeData(data);
        } catch (error) {
            console.error('Error parsing EventSource message:', error);
        }
    },

    // Handle Service Worker messages
    handleServiceWorkerMessage: function(data) {
        console.log('Received Service Worker message:', data);
        this.processRealtimeData(data);
    },

    // Process all real-time data
    processRealtimeData: function(data) {
        const { type, action, payload, timestamp, source, priority } = data;
        
        console.log(`Real-time data: ${action} on ${type} from ${source}`);

        // Update data store
        this.updateDataStore(type, action, payload);

        // Notify subscribers
        this.notifySubscribers(type, {
            action,
            payload,
            timestamp,
            source,
            priority
        });

        // Trigger cross-tab updates
        this.broadcastCrossTabUpdate(type, {
            action,
            payload,
            timestamp
        });

        // Update UI components
        this.updateUIComponents(type, action, payload);

        // Show notifications for high priority updates
        if (priority === 'high') {
            this.showRealtimeNotification(type, action, payload);
        }
    },

    // Update data store
    updateDataStore: function(type, action, payload) {
        if (!this.dataStore.has(type)) {
            this.dataStore.set(type, []);
        }

        const data = this.dataStore.get(type);
        
        switch (action) {
            case 'create':
                data.unshift(payload);
                break;
            case 'update':
                const index = data.findIndex(item => item.id === payload.id);
                if (index !== -1) {
                    data[index] = { ...data[index], ...payload };
                }
                break;
            case 'delete':
                const deleteIndex = data.findIndex(item => item.id === payload.id);
                if (deleteIndex !== -1) {
                    data.splice(deleteIndex, 1);
                }
                break;
            case 'bulk_update':
                // Replace entire dataset
                this.dataStore.set(type, payload);
                return;
        }

        // Limit data store size to prevent memory issues
        if (data.length > 1000) {
            data.splice(1000);
        }

        this.dataStore.set(type, data);
    },

    // Notify all subscribers
    notifySubscribers: function(type, data) {
        const subscribers = this.subscribers.get(type);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    },

    // Broadcast updates to other tabs
    broadcastCrossTabUpdate: function(type, data) {
        const storageKey = `shikola_realtime_${type}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        // Remove after short delay to prevent storage bloat
        setTimeout(() => {
            localStorage.removeItem(storageKey);
        }, 1000);
    },

    // Handle cross-tab updates
    handleCrossTabUpdate: function(data) {
        const { type, action, payload } = data;
        this.updateDataStore(type, action, payload);
        this.notifySubscribers(type, data);
        this.updateUIComponents(type, action, payload);
    },

    // Update UI components globally
    updateUIComponents: function(type, action, payload) {
        // Trigger custom events for different UI components
        const events = [
            `shikola:${type}:update`,
            `shikola:data:changed`,
            `shikola:ui:refresh`
        ];

        events.forEach(eventName => {
            window.dispatchEvent(new CustomEvent(eventName, {
                detail: { type, action, payload, timestamp: Date.now() }
            }));
        });

        // Specific module updates
        this.updateSpecificComponents(type, action, payload);
    },

    // Update specific components based on data type
    updateSpecificComponents: function(type, action, payload) {
        const componentUpdates = {
            'fees': () => this.updateFeesComponents(action, payload),
            'expenses': () => this.updateExpensesComponents(action, payload),
            'users': () => this.updateUsersComponents(action, payload),
            'courses': () => this.updateCoursesComponents(action, payload),
            'grades': () => this.updateGradesComponents(action, payload),
            'attendance': () => this.updateAttendanceComponents(action, payload),
            'notifications': () => this.updateNotificationsComponents(action, payload),
            'announcements': () => this.updateAnnouncementsComponents(action, payload)
        };

        if (componentUpdates[type]) {
            componentUpdates[type]();
        }
    },

    // Update fees-related components
    updateFeesComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('fees:update', {
            detail: { action, payload }
        }));
        
        // Update dashboard stats
        if (window.updateDashboardStats) {
            window.updateDashboardStats('fees', action, payload);
        }
    },

    // Update expenses-related components
    updateExpensesComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('expenses:update', {
            detail: { action, payload }
        }));
    },

    // Update users-related components
    updateUsersComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('users:update', {
            detail: { action, payload }
        }));
    },

    // Update courses-related components
    updateCoursesComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('courses:update', {
            detail: { action, payload }
        }));
    },

    // Update grades-related components
    updateGradesComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('grades:update', {
            detail: { action, payload }
        }));
    },

    // Update attendance-related components
    updateAttendanceComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('attendance:update', {
            detail: { action, payload }
        }));
    },

    // Update notifications
    updateNotificationsComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('notifications:update', {
            detail: { action, payload }
        }));
        
        // Show browser notification
        this.showBrowserNotification(payload.title, payload.message);
    },

    // Update announcements
    updateAnnouncementsComponents: function(action, payload) {
        window.dispatchEvent(new CustomEvent('announcements:update', {
            detail: { action, payload }
        }));
    },

    // Show real-time notification
    showRealtimeNotification: function(type, action, payload) {
        const messages = {
            fees: {
                create: `New fee payment received: ZMW ${payload.amount || 0}`,
                update: `Fee payment updated: ZMW ${payload.amount || 0}`,
                delete: 'Fee payment deleted'
            },
            expenses: {
                create: `New expense added: ZMW ${payload.amount || 0}`,
                update: `Expense updated: ZMW ${payload.amount || 0}`,
                delete: 'Expense deleted'
            },
            users: {
                create: `New user registered: ${payload.name || 'Unknown'}`,
                update: `User updated: ${payload.name || 'Unknown'}`,
                delete: `User deleted: ${payload.name || 'Unknown'}`
            },
            default: `${type} ${action} operation completed`
        };

        const message = messages[type]?.[action] || messages.default;
        this.showBrowserNotification('Real-time Update', message);
    },

    // Show browser notification
    showBrowserNotification: function(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/frontend/public/images/favicon.png',
                badge: '/frontend/public/images/favicon.png',
                tag: 'shikola-realtime',
                requireInteraction: false
            });
        }
    },

    // Request notification permissions
    requestNotificationPermission: function() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    },

    // Send initial sync request
    sendInitialSync: function() {
        if (this.connections.websocket && this.connections.websocket.readyState === WebSocket.OPEN) {
            this.connections.websocket.send(JSON.stringify({
                type: 'sync_request',
                payload: {
                    modules: ['fees', 'expenses', 'users', 'courses', 'grades', 'attendance'],
                    timestamp: Date.now()
                }
            }));
        }
    },

    // Process queued events
    processEventQueue: function() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processRealtimeData(event);
        }
    },

    // Queue event for later processing
    queueEvent: function(event) {
        this.eventQueue.push(event);
    },

    // Setup periodic sync
    setupPeriodicSync: function() {
        // Fast sync for critical data
        setInterval(() => {
            this.performFastSync();
        }, this.config.syncIntervals.fast);

        // Medium sync for regular data
        setInterval(() => {
            this.performMediumSync();
        }, this.config.syncIntervals.medium);

        // Slow sync for background data
        setInterval(() => {
            this.performSlowSync();
        }, this.config.syncIntervals.slow);
    },

    // Perform fast sync for critical data
    performFastSync: async function() {
        const criticalTypes = ['notifications', 'announcements'];
        
        for (const type of criticalTypes) {
            if (!this.syncInProgress.has(type)) {
                this.syncInProgress.add(type);
                try {
                    await this.fetchData(type, true);
                } catch (error) {
                    console.error(`Fast sync error for ${type}:`, error);
                } finally {
                    this.syncInProgress.delete(type);
                }
            }
        }
    },

    // Perform medium sync for regular data
    performMediumSync: async function() {
        const regularTypes = ['fees', 'expenses', 'users'];
        
        for (const type of regularTypes) {
            if (!this.syncInProgress.has(type)) {
                this.syncInProgress.add(type);
                try {
                    await this.fetchData(type, false);
                } catch (error) {
                    console.error(`Medium sync error for ${type}:`, error);
                } finally {
                    this.syncInProgress.delete(type);
                }
            }
        }
    },

    // Perform slow sync for background data
    performSlowSync: async function() {
        const backgroundTypes = ['courses', 'grades', 'attendance'];
        
        for (const type of backgroundTypes) {
            if (!this.syncInProgress.has(type)) {
                this.syncInProgress.add(type);
                try {
                    await this.fetchData(type, false);
                } catch (error) {
                    console.error(`Slow sync error for ${type}:`, error);
                } finally {
                    this.syncInProgress.delete(type);
                }
            }
        }
    },

    // Perform polling sync
    performPollingSync: async function() {
        const types = ['fees', 'expenses', 'users', 'courses', 'grades', 'attendance'];
        
        for (const type of types) {
            try {
                await this.fetchData(type, false);
            } catch (error) {
                console.error(`Polling sync error for ${type}:`, error);
            }
        }
    },

    // Fetch data from API
    fetchData: async function(type, forceRefresh = false) {
        if (!this.connections.isOnline) {
            console.log('Offline, skipping data fetch for', type);
            return;
        }

        try {
            const cachedData = this.getData(type);
            if (!forceRefresh && cachedData.length > 0) {
                return cachedData;
            }

            const endpoint = this.config.apiEndpoints[type];
            if (!endpoint) {
                console.warn(`No endpoint configured for type: ${type}`);
                return [];
            }

            const response = await window.sharedApiClient.request(endpoint);
            if (response.ok) {
                const data = await response.json();
                this.updateDataStore(type, 'bulk_update', data);
                return data;
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            return this.getData(type); // Return cached data on error
        }
    },

    // Get data from store
    getData: function(type) {
        return this.dataStore.get(type) || [];
    },

    // Subscribe to data updates
    subscribe: function(type, callback, options = {}) {
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

    // Broadcast data change
    broadcastChange: function(type, action, data, priority = 'normal') {
        const message = {
            type,
            action,
            payload: data,
            timestamp: Date.now(),
            source: 'client',
            priority
        };

        // Send via WebSocket if available
        if (this.connections.websocket && this.connections.websocket.readyState === WebSocket.OPEN) {
            this.connections.websocket.send(JSON.stringify(message));
        }

        // Queue for later processing if not connected
        if (!this.connections.isOnline) {
            this.queueEvent(message);
        }

        // Update local store immediately
        this.updateDataStore(type, action, data);
    },

    // Attempt to reconnect connections
    reconnectAll: function() {
        if (this.connections.reconnectAttempts < this.connections.maxReconnectAttempts) {
            this.connections.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.connections.reconnectAttempts}/${this.connections.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.initializeConnections();
            }, this.connections.reconnectDelay);
            
            this.connections.reconnectDelay *= 2; // Exponential backoff
        } else {
            console.log('Max reconnection attempts reached, switching to polling');
            this.setupPollingFallback();
        }
    },

    // Handle connection errors
    handleConnectionError: function(error) {
        console.error('Real-time connection error:', error);
        this.notifySubscribers('connection', {
            type: 'error',
            action: 'connection_lost',
            payload: { error: error.message }
        });
    },

    // Get connection status
    getConnectionStatus: function() {
        return {
            isOnline: this.connections.isOnline,
            websocketConnected: this.connections.websocket && this.connections.websocket.readyState === WebSocket.OPEN,
            eventSourceConnected: this.connections.eventSource && this.connections.eventSource.readyState === EventSource.OPEN,
            reconnectAttempts: this.connections.reconnectAttempts
        };
    },

    // Get sync statistics
    getSyncStats: function() {
        return {
            dataStoreSize: this.dataStore.size,
            subscriberCount: Array.from(this.subscribers.values()).reduce((total, set) => total + set.size, 0),
            eventQueueSize: this.eventQueue.length,
            syncInProgressCount: this.syncInProgress.size
        };
    },

    // Cleanup resources
    cleanup: function() {
        if (this.connections.websocket) {
            this.connections.websocket.close();
        }
        if (this.connections.eventSource) {
            this.connections.eventSource.close();
        }
        this.dataStore.clear();
        this.subscribers.clear();
        this.eventQueue = [];
        this.syncInProgress.clear();
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    enhancedRealtimeSystem.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    enhancedRealtimeSystem.cleanup();
});
