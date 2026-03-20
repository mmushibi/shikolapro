// Real-time Data Fetching and Sharing for Shikola Pro HR Module
console.log('Real-time Data Fetching System loaded');

window.realtimeDataFetcher = {
    // Configuration
    config: {
        pollingInterval: 5000, // 5 seconds
        retryAttempts: 3,
        retryDelay: 2000,
        batchSize: 50
    },
    
    // State
    isOnline: navigator.onLine,
    lastSyncTime: 0,
    activeRequests: new Map(),
    
    // Initialize system
    init: function() {
        console.log('Initializing real-time data fetcher...');
        
        // Set up online/offline listeners
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Set up visibility change listener
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Start periodic sync
        this.startPeriodicSync();
        
        // Set up cross-tab communication
        this.setupCrossTabCommunication();
    },
    
    // Handle online event
    handleOnline: function() {
        console.log('Connection restored - resuming real-time sync');
        this.isOnline = true;
        this.startPeriodicSync();
    },
    
    // Handle offline event
    handleOffline: function() {
        console.log('Connection lost - pausing real-time sync');
        this.isOnline = false;
        this.stopPeriodicSync();
    },
    
    // Handle visibility change
    handleVisibilityChange: function() {
        if (!document.hidden) {
            console.log('Page became visible - triggering sync');
            this.syncAllData();
        }
    },
    
    // Set up cross-tab communication
    setupCrossTabCommunication: function() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
        
        // Set up custom event channel
        this.eventChannel = new BroadcastChannel('hr_data_sync');
        this.eventChannel.onmessage = this.handleBroadcastMessage.bind(this);
    },
    
    // Handle storage events
    handleStorageEvent: function(event) {
        if (event.key && event.key.startsWith('hr_')) {
            console.log('Storage change detected:', event.key);
            const dataType = event.key.replace('hr_', '');
            this.notifyDataChange(dataType, 'storage', {
                oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
                newValue: event.newValue ? JSON.parse(event.newValue) : null
            });
        }
    },
    
    // Handle broadcast messages
    handleBroadcastMessage: function(event) {
        if (event.data && event.data.type === 'data_change') {
            console.log('Broadcast message received:', event.data);
            this.notifyDataChange(event.data.dataType, 'broadcast', event.data.payload);
        }
    },
    
    // Start periodic sync
    startPeriodicSync: function() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !document.hidden) {
                this.syncAllData();
            }
        }, this.config.pollingInterval);
    },
    
    // Stop periodic sync
    stopPeriodicSync: function() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },
    
    // Sync all data types
    syncAllData: function() {
        const dataTypes = ['employees', 'leave', 'payroll', 'performance', 'recruitment', 'training', 'policies', 'settings'];
        
        dataTypes.forEach(dataType => {
            this.syncDataType(dataType);
        });
    },
    
    // Sync specific data type
    syncDataType: function(dataType) {
        if (!this.isOnline) {
            console.log(`Skipping ${dataType} sync - offline`);
            return;
        }
        
        // Avoid duplicate requests
        const requestKey = `${dataType}_sync`;
        if (this.activeRequests.has(requestKey)) {
            console.log(`${dataType} sync already in progress`);
            return;
        }
        
        this.activeRequests.set(requestKey, Date.now());
        
        // Fetch from server
        this.fetchFromServer(dataType)
            .then(data => {
                this.processServerData(dataType, data);
                this.activeRequests.delete(requestKey);
            })
            .catch(error => {
                console.error(`Error syncing ${dataType}:`, error);
                this.activeRequests.delete(requestKey);
                
                // Retry logic
                if (error.retryable) {
                    setTimeout(() => this.syncDataType(dataType), this.config.retryDelay);
                }
            });
    },
    
    // Fetch data from server
    fetchFromServer: function(dataType) {
        if (!window.sharedApiClient) {
            return Promise.resolve({ data: [], fromCache: true });
        }
        
        const lastSync = localStorage.getItem(`hr_${dataType}_last_sync`) || 0;
        
        return sharedApiClient.request(`/hr/data/${dataType}`, {
            method: 'GET',
            headers: {
                'If-Modified-Since': new Date(lastSync).toUTCString()
            }
        })
        .then(response => {
            if (response.status === 304) {
                // Not modified
                return { data: [], fromCache: true };
            }
            return response.json();
        })
        .then(data => {
            if (!data.fromCache) {
                localStorage.setItem(`hr_${dataType}_last_sync`, Date.now().toString());
            }
            return data;
        })
        .catch(error => {
            console.error(`Fetch error for ${dataType}:`, error);
            return Promise.reject({ error, retryable: true });
        });
    },
    
    // Process server data
    processServerData: function(dataType, serverData) {
        if (!serverData || !serverData.data) {
            return;
        }
        
        const localData = window.hrSavingSystem ? 
            hrSavingSystem.getData(dataType) : [];
        
        // Merge server and local data
        const mergedData = this.mergeData(localData, serverData.data);
        
        // Update local storage
        if (window.hrSavingSystem) {
            hrSavingSystem.saveData(dataType, mergedData);
        }
        
        // Notify listeners
        this.notifyDataChange(dataType, 'server_sync', {
            serverData: serverData.data,
            localData: localData,
            mergedData: mergedData
        });
        
        // Broadcast to other tabs
        this.broadcastDataChange(dataType, mergedData);
        
        this.lastSyncTime = Date.now();
    },
    
    // Merge local and server data
    mergeData: function(localData, serverData) {
        const merged = [...localData];
        const serverIds = new Set(serverData.map(item => item.id));
        
        // Add or update items from server
        serverData.forEach(serverItem => {
            const existingIndex = merged.findIndex(item => item.id === serverItem.id);
            if (existingIndex !== -1) {
                // Update existing item if server version is newer
                if (this.isServerVersionNewer(merged[existingIndex], serverItem)) {
                    merged[existingIndex] = { ...merged[existingIndex], ...serverItem };
                }
            } else {
                // Add new item from server
                merged.unshift(serverItem);
            }
        });
        
        // Keep local items that don't exist on server
        return merged.filter(item => !serverIds.has(item.id) || item.isLocalOnly);
    },
    
    // Check if server version is newer
    isServerVersionNewer: function(localItem, serverItem) {
        if (!localItem.updatedAt && !serverItem.updatedAt) {
            return false;
        }
        
        if (!localItem.updatedAt) {
            return true;
        }
        
        if (!serverItem.updatedAt) {
            return false;
        }
        
        return new Date(serverItem.updatedAt) > new Date(localItem.updatedAt);
    },
    
    // Notify data change
    notifyDataChange: function(dataType, source, payload) {
        // Custom event for Alpine.js components
        if (window.Alpine) {
            window.dispatchEvent(new CustomEvent('hrDataChange', {
                detail: { dataType, source, payload }
            }));
        }
        
        // Notify real-time sync system
        if (window.realTimeSync) {
            realTimeSync.notifyListeners(dataType, source, payload);
        }
    },
    
    // Broadcast data change to other tabs
    broadcastDataChange: function(dataType, data) {
        if (this.eventChannel) {
            this.eventChannel.postMessage({
                type: 'data_change',
                dataType: dataType,
                payload: { data }
            });
        }
    },
    
    // Manual refresh
    refreshData: function(dataType) {
        console.log(`Manual refresh requested for ${dataType}`);
        
        // Clear last sync time to force refresh
        localStorage.removeItem(`hr_${dataType}_last_sync`);
        
        // Trigger immediate sync
        this.syncDataType(dataType);
    },
    
    // Get sync status
    getSyncStatus: function() {
        return {
            isOnline: this.isOnline,
            lastSyncTime: this.lastSyncTime,
            activeRequests: Array.from(this.activeRequests.keys()),
            config: this.config
        };
    },
    
    // Update configuration
    updateConfig: function(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Restart periodic sync with new interval
        if (this.syncInterval) {
            this.startPeriodicSync();
        }
        
        console.log('Real-time fetcher config updated:', this.config);
    },
    
    // Cleanup
    cleanup: function() {
        this.stopPeriodicSync();
        
        if (this.eventChannel) {
            this.eventChannel.close();
        }
        
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        window.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        console.log('Real-time data fetcher cleaned up');
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    realtimeDataFetcher.init();
});
