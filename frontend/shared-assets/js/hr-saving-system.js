// HR Data Saving System for Shikola Pro
console.log('HR Saving System loaded');

window.hrSavingSystem = {
    // Local storage keys
    storageKeys: {
        employees: 'hr_employees',
        leave: 'hr_leave_requests',
        payroll: 'hr_payroll_entries',
        performance: 'hr_performance_reviews',
        recruitment: 'hr_recruitment_applications',
        training: 'hr_training_programs',
        policies: 'hr_company_policies',
        settings: 'hr_settings'
    },

    // Initialize the saving system
    init: function() {
        console.log('HR Saving System initialized');
        this.loadAllData();
    },

    // Load all data from localStorage
    loadAllData: function() {
        const data = {};
        Object.keys(this.storageKeys).forEach(key => {
            const stored = localStorage.getItem(this.storageKeys[key]);
            data[key] = stored ? JSON.parse(stored) : [];
        });
        return data;
    },

    // Save data to localStorage
    saveData: function(type, data) {
        const key = this.storageKeys[type];
        if (!key) {
            console.error('Unknown data type:', type);
            return false;
        }
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`${type} data saved successfully`);
            return true;
        } catch (error) {
            console.error(`Error saving ${type} data:`, error);
            return false;
        }
    },

    // Get data of specific type
    getData: function(type) {
        const key = this.storageKeys[type];
        if (!key) {
            console.error('Unknown data type:', type);
            return [];
        }
        
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    },

    // Add new item to data
    addItem: function(type, item) {
        const data = this.getData(type);
        const newItem = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            ...item
        };
        
        data.unshift(newItem);
        this.saveData(type, data);
        
        // Broadcast change for real-time sync
        if (window.realTimeSync) {
            realTimeSync.broadcastChange(type, 'create', newItem);
        }
        
        return newItem;
    },

    // Update existing item
    updateItem: function(type, id, updates) {
        const data = this.getData(type);
        const index = data.findIndex(item => item.id === id);
        
        if (index !== -1) {
            data[index] = {
                ...data[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(type, data);
            
            // Broadcast change for real-time sync
            if (window.realTimeSync) {
                realTimeSync.broadcastChange(type, 'update', data[index]);
            }
            
            return data[index];
        }
        
        return null;
    },

    // Delete item
    deleteItem: function(type, id) {
        const data = this.getData(type);
        const filteredData = data.filter(item => item.id !== id);
        
        if (filteredData.length !== data.length) {
            this.saveData(type, filteredData);
            
            // Broadcast change for real-time sync
            if (window.realTimeSync) {
                realTimeSync.broadcastChange(type, 'delete', { id });
            }
            
            return true;
        }
        
        return false;
    },

    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Show success message
    showSuccess: function(message) {
        if (window.sharedMessages) {
            sharedMessages.showSuccess(message);
        } else {
            alert(message);
        }
    },

    // Show error message
    showError: function(message) {
        if (window.sharedMessages) {
            sharedMessages.showError(message);
        } else {
            alert(message);
        }
    },

    // Sync with server (if API is available)
    syncWithServer: async function(type, data, action = 'save') {
        if (!window.sharedApiClient) {
            console.log('API client not available, using local storage only');
            return null;
        }

        try {
            let response;
            switch (action) {
                case 'save':
                    response = await sharedApiClient.request(`/hr/${type}`, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    break;
                case 'update':
                    response = await sharedApiClient.request(`/hr/${type}/${data.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    break;
                case 'delete':
                    response = await sharedApiClient.request(`/hr/${type}/${data.id}`, {
                        method: 'DELETE'
                    });
                    break;
            }
            
            return response;
        } catch (error) {
            console.error('Server sync failed:', error);
            return null;
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    hrSavingSystem.init();
});
