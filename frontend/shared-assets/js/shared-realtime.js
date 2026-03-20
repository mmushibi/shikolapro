// Shared Real-time Data Management for Shikola Pro Hostel Module
console.log('Shared Real-time Service loaded');

window.sharedRealtime = {
    websocket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    
    // Shared state for hostel data
    hostelState: {
        rooms: [],
        residents: [],
        allocations: [],
        lastUpdated: {
            rooms: null,
            residents: null,
            allocations: null
        }
    },
    
    // Event listeners
    listeners: {
        rooms: [],
        residents: [],
        allocations: [],
        notifications: []
    },
    
    init: function() {
        console.log('Initializing real-time service...');
        this.initWebSocket();
        this.setupStorageEvents();
        this.loadCachedData();
    },
    
    initWebSocket: function() {
        try {
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/hostel`;
            console.log('Connecting to WebSocket:', wsUrl);
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.requestInitialData();
            };
            
            this.websocket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect();
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.attemptReconnect();
            };
            
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.fallbackToPolling();
        }
    },
    
    attemptReconnect: function() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.initWebSocket();
            }, this.reconnectDelay);
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            this.fallbackToPolling();
        }
    },
    
    fallbackToPolling: function() {
        console.log('Using polling fallback');
        setInterval(() => {
            this.pollForUpdates();
        }, 10000); // Poll every 10 seconds
    },
    
    pollForUpdates: function() {
        // Check for updates via HTTP polling
        this.checkRoomsUpdate();
        this.checkResidentsUpdate();
        this.checkAllocationsUpdate();
    },
    
    handleMessage: function(data) {
        console.log('Received real-time update:', data);
        
        switch (data.type) {
            case 'initial_data':
                this.handleInitialData(data.payload);
                break;
            case 'rooms_update':
                this.handleRoomsUpdate(data.payload);
                break;
            case 'residents_update':
                this.handleResidentsUpdate(data.payload);
                break;
            case 'allocations_update':
                this.handleAllocationsUpdate(data.payload);
                break;
            case 'notification':
                this.handleNotification(data.payload);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    },
    
    handleInitialData: function(data) {
        this.hostelState.rooms = data.rooms || [];
        this.hostelState.residents = data.residents || [];
        this.hostelState.allocations = data.allocations || [];
        
        this.hostelState.lastUpdated.rooms = new Date();
        this.hostelState.lastUpdated.residents = new Date();
        this.hostelState.lastUpdated.allocations = new Date();
        
        this.cacheData();
        this.notifyListeners('rooms', this.hostelState.rooms);
        this.notifyListeners('residents', this.hostelState.residents);
        this.notifyListeners('allocations', this.hostelState.allocations);
    },
    
    handleRoomsUpdate: function(data) {
        if (data.action === 'create' || data.action === 'update') {
            const existingIndex = this.hostelState.rooms.findIndex(room => room.id === data.room.id);
            if (existingIndex >= 0) {
                this.hostelState.rooms[existingIndex] = data.room;
            } else {
                this.hostelState.rooms.push(data.room);
            }
        } else if (data.action === 'delete') {
            this.hostelState.rooms = this.hostelState.rooms.filter(room => room.id !== data.roomId);
        }
        
        this.hostelState.lastUpdated.rooms = new Date();
        this.cacheData();
        this.notifyListeners('rooms', this.hostelState.rooms);
    },
    
    handleResidentsUpdate: function(data) {
        if (data.action === 'create' || data.action === 'update') {
            const existingIndex = this.hostelState.residents.findIndex(resident => resident.id === data.resident.id);
            if (existingIndex >= 0) {
                this.hostelState.residents[existingIndex] = data.resident;
            } else {
                this.hostelState.residents.push(data.resident);
            }
        } else if (data.action === 'delete') {
            this.hostelState.residents = this.hostelState.residents.filter(resident => resident.id !== data.residentId);
        }
        
        this.hostelState.lastUpdated.residents = new Date();
        this.cacheData();
        this.notifyListeners('residents', this.hostelState.residents);
    },
    
    handleAllocationsUpdate: function(data) {
        if (data.action === 'create' || data.action === 'update') {
            const existingIndex = this.hostelState.allocations.findIndex(allocation => allocation.id === data.allocation.id);
            if (existingIndex >= 0) {
                this.hostelState.allocations[existingIndex] = data.allocation;
            } else {
                this.hostelState.allocations.push(data.allocation);
            }
        } else if (data.action === 'delete') {
            this.hostelState.allocations = this.hostelState.allocations.filter(allocation => allocation.id !== data.allocationId);
        }
        
        this.hostelState.lastUpdated.allocations = new Date();
        this.cacheData();
        this.notifyListeners('allocations', this.hostelState.allocations);
    },
    
    handleNotification: function(notification) {
        console.log('Real-time notification:', notification);
        this.notifyListeners('notifications', notification);
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/frontend/public/images/favicon.png'
            });
        }
    },
    
    requestInitialData: function() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'request_initial_data',
                payload: {
                    module: 'hostel'
                }
            }));
        }
    },
    
    // Event listener management
    subscribe: function(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        }
    },
    
    unsubscribe: function(eventType, callback) {
        if (this.listeners[eventType]) {
            const index = this.listeners[eventType].indexOf(callback);
            if (index > -1) {
                this.listeners[eventType].splice(index, 1);
            }
        }
    },
    
    notifyListeners: function(eventType, data) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    },
    
    // Local storage for offline support
    cacheData: function() {
        try {
            localStorage.setItem('hostelState', JSON.stringify(this.hostelState));
        } catch (error) {
            console.error('Failed to cache hostel state:', error);
        }
    },
    
    loadCachedData: function() {
        try {
            const cached = localStorage.getItem('hostelState');
            if (cached) {
                const parsed = JSON.parse(cached);
                this.hostelState = { ...this.hostelState, ...parsed };
                console.log('Loaded cached hostel state');
            }
        } catch (error) {
            console.error('Failed to load cached hostel state:', error);
        }
    },
    
    setupStorageEvents: function() {
        // Listen for changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === 'hostelState') {
                try {
                    const newState = JSON.parse(event.newValue);
                    this.hostelState = { ...this.hostelState, ...newState };
                    this.notifyListeners('rooms', this.hostelState.rooms);
                    this.notifyListeners('residents', this.hostelState.residents);
                    this.notifyListeners('allocations', this.hostelState.allocations);
                } catch (error) {
                    console.error('Error handling storage event:', error);
                }
            }
        });
    },
    
    // HTTP polling fallback methods
    checkRoomsUpdate: async function() {
        try {
            const response = await window.sharedApiClient.get('/hostel/rooms');
            if (response.success && JSON.stringify(response.data) !== JSON.stringify(this.hostelState.rooms)) {
                this.handleRoomsUpdate({
                    action: 'update',
                    room: response.data
                });
            }
        } catch (error) {
            console.error('Error checking rooms update:', error);
        }
    },
    
    checkResidentsUpdate: async function() {
        try {
            const response = await window.sharedApiClient.get('/hostel/residents');
            if (response.success && JSON.stringify(response.data) !== JSON.stringify(this.hostelState.residents)) {
                this.handleResidentsUpdate({
                    action: 'update',
                    resident: response.data
                });
            }
        } catch (error) {
            console.error('Error checking residents update:', error);
        }
    },
    
    checkAllocationsUpdate: async function() {
        try {
            const response = await window.sharedApiClient.get('/hostel/allocations');
            if (response.success && JSON.stringify(response.data) !== JSON.stringify(this.hostelState.allocations)) {
                this.handleAllocationsUpdate({
                    action: 'update',
                    allocation: response.data
                });
            }
        } catch (error) {
            console.error('Error checking allocations update:', error);
        }
    },
    
    // Utility methods
    getRooms: function() {
        return this.hostelState.rooms;
    },
    
    getResidents: function() {
        return this.hostelState.residents;
    },
    
    getAllocations: function() {
        return this.hostelState.allocations;
    },
    
    getLastUpdated: function(type) {
        return this.hostelState.lastUpdated[type];
    },
    
    // Request notification permissions
    requestNotificationPermission: function() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sharedRealtime.init();
    });
} else {
    window.sharedRealtime.init();
}
