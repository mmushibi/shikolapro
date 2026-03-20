// Comprehensive Data Management System
console.log('Data Management System loaded');

window.dataManager = {
    // Data storage structure
    dataStores: {
        users: [],
        courses: [],
        enrollments: [],
        grades: [],
        attendance: [],
        notifications: [],
        assignments: [],
        submissions: [],
        communications: [],
        financial: [],
        reports: [],
        audit: []
    },

    // Real-time sync configuration
    syncConfig: {
        enabled: true,
        interval: 15000, // 15 seconds
        retryAttempts: 3,
        retryDelay: 5000
    },

    // Cache management
    cache: {
        enabled: true,
        maxSize: 1000, // Maximum items per store
        ttl: 300000 // 5 minutes TTL
    },

    init: function() {
        console.log('Initializing data management system...');
        this.setupDataStores();
        this.setupRealtimeSync();
        this.setupDataValidation();
        this.setupCacheManagement();
        this.setupDataSharing();
        this.loadInitialData();
    },

    // Data store setup
    setupDataStores: function() {
        Object.keys(this.dataStores).forEach(store => {
            const storedData = localStorage.getItem(`data_${store}`);
            if (storedData) {
                try {
                    this.dataStores[store] = JSON.parse(storedData);
                } catch (e) {
                    console.error(`Error loading ${store} data:`, e);
                    this.dataStores[store] = [];
                }
            }
        });
    },

    // Data fetching methods
    fetchData: function(store, options = {}) {
        const {
            filters = {},
            sort = {},
            pagination = {},
            cache = true
        } = options;

        // Check cache first
        if (cache && this.cache.enabled) {
            const cachedData = this.getCachedData(store, options);
            if (cachedData) {
                return Promise.resolve(cachedData);
            }
        }

        // Fetch from backend API
        return new Promise((resolve, reject) => {
            // Build query parameters
            const params = { ...filters };
            
            if (pagination.page) params.page = pagination.page;
            if (pagination.limit) params.limit = pagination.limit;
            if (sort.field) params.sort = sort.field;
            if (sort.order) params.order = sort.order;

            window.sharedApiClient.getData(store, params)
                .then(response => {
                    let data = Array.isArray(response) ? response : response.data || response.users || response;
                    
                    // Apply client-side filtering if needed
                    if (Object.keys(filters).length > 0 && !params.page) {
                        data = this.applyFilters(data, filters);
                    }

                    // Apply client-side sorting if needed
                    if (sort.field && !params.sort) {
                        data = this.applySorting(data, sort);
                    }

                    // Apply client-side pagination if needed
                    let paginatedData = data;
                    if (pagination.page && pagination.limit && !params.page) {
                        paginatedData = this.applyPagination(data, pagination);
                    }

                    // Cache results
                    if (cache && this.cache.enabled) {
                        this.setCachedData(store, options, paginatedData);
                    }

                    resolve(paginatedData);
                })
                .catch(error => {
                    // Fallback to localStorage if API fails
                    console.warn('API failed, falling back to localStorage:', error);
                    this.fetchFromLocalStorage(store, options)
                        .then(resolve)
                        .catch(reject);
                });
        });
    },

    // Fallback method for localStorage
    fetchFromLocalStorage: function(store, options = {}) {
        const {
            filters = {},
            sort = {},
            pagination = {},
            cache = true
        } = options;

        return new Promise((resolve, reject) => {
            try {
                let data = [...this.dataStores[store]];

                // Apply filters
                data = this.applyFilters(data, filters);

                // Apply sorting
                data = this.applySorting(data, sort);

                // Apply pagination
                const paginatedData = this.applyPagination(data, pagination);

                // Cache results
                if (cache && this.cache.enabled) {
                    this.setCachedData(store, options, paginatedData);
                }

                resolve(paginatedData);
            } catch (error) {
                reject(error);
            }
        });
    },

    applyFilters: function(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }

        return data.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];

                if (Array.isArray(filterValue)) {
                    return filterValue.includes(itemValue);
                }

                if (typeof filterValue === 'object' && filterValue !== null) {
                    // Handle range filters
                    if (filterValue.min !== undefined && filterValue.max !== undefined) {
                        return itemValue >= filterValue.min && itemValue <= filterValue.max;
                    }
                    if (filterValue.contains) {
                        return itemValue && itemValue.toString().toLowerCase().includes(filterValue.contains.toLowerCase());
                    }
                }

                return itemValue === filterValue;
            });
        });
    },

    applySorting: function(data, sort) {
        if (!sort || Object.keys(sort).length === 0) {
            return data;
        }

        const { field, order = 'asc' } = sort;

        return data.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            let comparison = 0;
            if (aVal > bVal) comparison = 1;
            if (aVal < bVal) comparison = -1;

            return order === 'desc' ? -comparison : comparison;
        });
    },

    applyPagination: function(data, pagination) {
        if (!pagination || !pagination.page || !pagination.limit) {
            return data;
        }

        const { page, limit } = pagination;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return {
            data: data.slice(startIndex, endIndex),
            total: data.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(data.length / limit)
        };
    },

    // Data saving methods
    saveData: function(store, data, options = {}) {
        const {
            merge = true,
            validate = true,
            sync = true
        } = options;

        return new Promise((resolve, reject) => {
            // Validate data if required
            if (validate) {
                const validation = this.validateData(store, data);
                if (!validation.valid) {
                    reject(new Error(validation.errors.join(', ')));
                    return;
                }
            }

            // Save to backend API
            if (Array.isArray(data)) {
                // Handle array data - save each item
                const savePromises = data.map(item => {
                    if (merge && item.id) {
                        // Update existing item
                        return window.sharedApiClient.updateData(store, item.id, item)
                            .catch(() => {
                                // If update fails, try to create new item
                                return window.sharedApiClient.createData(store, item);
                            });
                    } else {
                        // Create new item
                        return window.sharedApiClient.createData(store, item);
                    }
                });

                Promise.all(savePromises)
                    .then(results => {
                        // Update local cache
                        this.updateLocalStore(store, data, merge);
                        
                        // Clear cache
                        this.clearCache(store);

                        // Log action
                        this.logDataAction('save', store, data);

                        resolve(results);
                    })
                    .catch(error => {
                        // Fallback to localStorage if API fails
                        console.warn('API save failed, falling back to localStorage:', error);
                        this.saveToLocalStorage(store, data, options)
                            .then(resolve)
                            .catch(reject);
                    });
            } else {
                // Handle single item
                const savePromise = (merge && data.id) 
                    ? window.sharedApiClient.updateData(store, data.id, data)
                        .catch(() => window.sharedApiClient.createData(store, data))
                    : window.sharedApiClient.createData(store, data);

                savePromise
                    .then(result => {
                        // Update local cache
                        this.updateLocalStore(store, data, merge);
                        
                        // Clear cache
                        this.clearCache(store);

                        // Log action
                        this.logDataAction('save', store, data);

                        resolve(result);
                    })
                    .catch(error => {
                        // Fallback to localStorage if API fails
                        console.warn('API save failed, falling back to localStorage:', error);
                        this.saveToLocalStorage(store, data, options)
                            .then(resolve)
                            .catch(reject);
                    });
            }
        });
    },

    // Update local store after API save
    updateLocalStore: function(store, data, merge) {
        let currentData = [...this.dataStores[store]];

        if (merge) {
            if (Array.isArray(data)) {
                data.forEach(item => {
                    const existingIndex = currentData.findIndex(d => d.id === item.id);
                    if (existingIndex >= 0) {
                        currentData[existingIndex] = { ...currentData[existingIndex], ...item };
                    } else {
                        currentData.push(item);
                    }
                });
            } else {
                const existingIndex = currentData.findIndex(d => d.id === data.id);
                if (existingIndex >= 0) {
                    currentData[existingIndex] = { ...currentData[existingIndex], ...data };
                } else {
                    currentData.push(data);
                }
            }
        } else {
            currentData = Array.isArray(data) ? data : [data];
        }

        this.dataStores[store] = currentData;
        localStorage.setItem(`data_${store}`, JSON.stringify(currentData));
    },

    // Fallback localStorage save method
    saveToLocalStorage: function(store, data, options = {}) {
        const { merge = true, validate = true } = options;

        return new Promise((resolve, reject) => {
            try {
                // Validate data if required
                if (validate) {
                    const validation = this.validateData(store, data);
                    if (!validation.valid) {
                        reject(new Error(validation.errors.join(', ')));
                        return;
                    }
                }

                // Get current data
                let currentData = [...this.dataStores[store]];

                // Merge or replace data
                if (merge) {
                    if (Array.isArray(data)) {
                        data.forEach(item => {
                            const existingIndex = currentData.findIndex(d => d.id === item.id);
                            if (existingIndex >= 0) {
                                currentData[existingIndex] = { ...currentData[existingIndex], ...item };
                            } else {
                                currentData.push(item);
                            }
                        });
                    } else {
                        const existingIndex = currentData.findIndex(d => d.id === data.id);
                        if (existingIndex >= 0) {
                            currentData[existingIndex] = { ...currentData[existingIndex], ...data };
                        } else {
                            currentData.push(data);
                        }
                    }
                } else {
                    currentData = Array.isArray(data) ? data : [data];
                }

                // Update data store
                this.dataStores[store] = currentData;

                // Save to localStorage
                localStorage.setItem(`data_${store}`, JSON.stringify(currentData));

                // Clear cache
                this.clearCache(store);

                // Log action
                this.logDataAction('save', store, data);

                resolve(currentData);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Data deletion
    deleteData: function(store, id, options = {}) {
        const { sync = true } = options;

        return new Promise((resolve, reject) => {
            try {
                const currentData = [...this.dataStores[store]];
                const index = currentData.findIndex(item => item.id === id);

                if (index === -1) {
                    reject(new Error('Item not found'));
                    return;
                }

                const deletedItem = currentData.splice(index, 1)[0];
                this.dataStores[store] = currentData;

                // Save to localStorage
                localStorage.setItem(`data_${store}`, JSON.stringify(currentData));

                // Clear cache
                this.clearCache(store);

                // Sync with other portals
                if (sync && this.syncConfig.enabled) {
                    this.syncData(store, currentData);
                }

                // Log action
                this.logDataAction('delete', store, deletedItem);

                resolve(deletedItem);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Real-time sync setup
    setupRealtimeSync: function() {
        if (!this.syncConfig.enabled) return;

        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key.startsWith('data_')) {
                const store = e.key.replace('data_', '');
                this.handleDataSync(store, JSON.parse(e.newValue || '[]'));
            }
        });

        // Listen for postMessage sync
        window.addEventListener('message', (e) => {
            if (e.data.type === 'DATA_SYNC') {
                this.handleDataSync(e.data.store, e.data.data);
            }
        });

        // Periodic sync
        setInterval(() => {
            this.performPeriodicSync();
        }, this.syncConfig.interval);
    },

    syncData: function(store, data) {
        // Broadcast to other portals
        const syncData = {
            type: 'DATA_SYNC',
            store: store,
            data: data,
            timestamp: Date.now(),
            user: window.rbacSystem?.getCurrentUser()?.id
        };

        // Store in localStorage for cross-tab sync
        localStorage.setItem(`sync_${store}`, JSON.stringify(syncData));

        // Send via postMessage for cross-window sync
        window.postMessage(syncData, '*');
    },

    handleDataSync: function(store, data) {
        // Update local data store
        this.dataStores[store] = data;

        // Clear cache
        this.clearCache(store);

        // Trigger UI update
        this.triggerDataUpdate(store, data);
    },

    performPeriodicSync: function() {
        Object.keys(this.dataStores).forEach(store => {
            const currentData = this.dataStores[store];
            this.syncData(store, currentData);
        });
    },

    // Cache management
    setupCacheManagement: function() {
        if (!this.cache.enabled) return;

        // Clean expired cache entries periodically
        setInterval(() => {
            this.cleanExpiredCache();
        }, 60000); // Every minute
    },

    getCachedData: function(store, options) {
        const cacheKey = this.getCacheKey(store, options);
        const cached = localStorage.getItem(`cache_${cacheKey}`);

        if (!cached) return null;

        try {
            const data = JSON.parse(cached);
            
            // Check TTL
            if (Date.now() - data.timestamp > this.cache.ttl) {
                localStorage.removeItem(`cache_${cacheKey}`);
                return null;
            }

            return data.data;
        } catch (e) {
            localStorage.removeItem(`cache_${cacheKey}`);
            return null;
        }
    },

    setCachedData: function(store, options, data) {
        const cacheKey = this.getCacheKey(store, options);
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };

        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cacheData));
    },

    getCacheKey: function(store, options) {
        const optionsHash = JSON.stringify(options);
        return `${store}_${btoa(optionsHash).replace(/[^a-zA-Z0-9]/g, '')}`;
    },

    clearCache: function(store) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(`cache_${store}_`)) {
                localStorage.removeItem(key);
            }
        });
    },

    cleanExpiredCache: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (Date.now() - data.timestamp > this.cache.ttl) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    },

    // Data validation
    setupDataValidation: function() {
        // Validation rules for different data types
        this.validationRules = {
            users: {
                required: ['id', 'name', 'email', 'role'],
                types: {
                    id: 'string',
                    name: 'string',
                    email: 'email',
                    role: 'string'
                }
            },
            courses: {
                required: ['id', 'name', 'code', 'tenantId'],
                types: {
                    id: 'string',
                    name: 'string',
                    code: 'string',
                    tenantId: 'string'
                }
            },
            enrollments: {
                required: ['id', 'studentId', 'courseId', 'tenantId'],
                types: {
                    id: 'string',
                    studentId: 'string',
                    courseId: 'string',
                    tenantId: 'string'
                }
            },
            grades: {
                required: ['id', 'studentId', 'courseId', 'grade', 'tenantId'],
                types: {
                    id: 'string',
                    studentId: 'string',
                    courseId: 'string',
                    grade: 'number',
                    tenantId: 'string'
                }
            },
            attendance: {
                required: ['id', 'studentId', 'courseId', 'date', 'status', 'tenantId'],
                types: {
                    id: 'string',
                    studentId: 'string',
                    courseId: 'string',
                    date: 'string',
                    status: 'string',
                    tenantId: 'string'
                }
            },
            notifications: {
                required: ['id', 'title', 'message', 'type', 'recipient'],
                types: {
                    id: 'string',
                    title: 'string',
                    message: 'string',
                    type: 'string',
                    recipient: 'string'
                }
            },
            assignments: {
                required: ['id', 'title', 'description', 'courseId', 'dueDate', 'tenantId'],
                types: {
                    id: 'string',
                    title: 'string',
                    description: 'string',
                    courseId: 'string',
                    dueDate: 'string',
                    tenantId: 'string'
                }
            },
            submissions: {
                required: ['id', 'assignmentId', 'studentId', 'content', 'submittedAt'],
                types: {
                    id: 'string',
                    assignmentId: 'string',
                    studentId: 'string',
                    content: 'string',
                    submittedAt: 'string'
                }
            },
            communications: {
                required: ['id', 'subject', 'message', 'senderId', 'recipientId', 'type'],
                types: {
                    id: 'string',
                    subject: 'string',
                    message: 'string',
                    senderId: 'string',
                    recipientId: 'string',
                    type: 'string'
                }
            },
            financial: {
                required: ['id', 'type', 'amount', 'studentId', 'tenantId'],
                types: {
                    id: 'string',
                    type: 'string',
                    amount: 'number',
                    studentId: 'string',
                    tenantId: 'string'
                }
            },
            reports: {
                required: ['id', 'type', 'title', 'data', 'generatedAt', 'generatedBy'],
                types: {
                    id: 'string',
                    type: 'string',
                    title: 'string',
                    data: 'object',
                    generatedAt: 'string',
                    generatedBy: 'string'
                }
            },
            audit: {
                required: ['id', 'action', 'entity', 'entityId', 'userId', 'timestamp'],
                types: {
                    id: 'string',
                    action: 'string',
                    entity: 'string',
                    entityId: 'string',
                    userId: 'string',
                    timestamp: 'string'
                }
            }
        };
    },

    validateData: function(store, data) {
        const rules = this.validationRules[store];
        if (!rules) {
            return { valid: true, errors: [] };
        }

        const errors = [];
        const items = Array.isArray(data) ? data : [data];

        items.forEach((item, index) => {
            // Check required fields
            rules.required.forEach(field => {
                if (!item[field]) {
                    errors.push(`Item ${index + 1}: Missing required field '${field}'`);
                }
            });

            // Check field types
            Object.keys(rules.types).forEach(field => {
                if (item[field] !== undefined) {
                    const expectedType = rules.types[field];
                    const actualType = this.getFieldType(item[field]);
                    
                    if (expectedType === 'email') {
                        if (!this.isValidEmail(item[field])) {
                            errors.push(`Item ${index + 1}: Invalid email format for '${field}'`);
                        }
                    } else if (actualType !== expectedType) {
                        errors.push(`Item ${index + 1}: Field '${field}' should be ${expectedType}, got ${actualType}`);
                    }
                }
            });
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    getFieldType: function(value) {
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object' && value !== null) return 'object';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'string';
    },

    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Data sharing setup
    setupDataSharing: function() {
        // Setup cross-portal data sharing
        this.setupCrossPortalSharing();
        this.setupDataPermissions();
        this.setupDataEncryption();
    },

    setupCrossPortalSharing: function() {
        // Listen for data sharing requests
        window.addEventListener('message', (e) => {
            if (e.data.type === 'DATA_SHARE_REQUEST') {
                this.handleDataShareRequest(e.data);
            }
        });
    },

    handleDataShareRequest: function(request) {
        const currentUser = window.rbacSystem?.getCurrentUser();
        if (!currentUser) return;

        // Check if user has permission to share this data
        if (!this.canShareData(request.store, currentUser)) {
            this.sendDataShareResponse(request.id, { error: 'Permission denied' });
            return;
        }

        // Fetch and share data
        this.fetchData(request.store, request.options)
            .then(data => {
                this.sendDataShareResponse(request.id, { data: data });
            })
            .catch(error => {
                this.sendDataShareResponse(request.id, { error: error.message });
            });
    },

    sendDataShareResponse: function(requestId, response) {
        const responseData = {
            type: 'DATA_SHARE_RESPONSE',
            requestId: requestId,
            response: response,
            timestamp: Date.now()
        };

        window.postMessage(responseData, '*');
    },

    setupDataPermissions: function() {
        // Define data access permissions
        this.dataPermissions = {
            users: ['system-admin', 'operations-admin', 'tenant-admin'],
            courses: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            enrollments: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            grades: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            attendance: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            notifications: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            assignments: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            submissions: ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            communications: ['system-admin', 'operations-admin', 'tenant-admin', 'staff', 'student', 'parent'],
            financial: ['system-admin', 'operations-admin', 'tenant-admin'],
            reports: ['system-admin', 'operations-admin', 'tenant-admin'],
            audit: ['system-admin']
        };
    },

    canShareData: function(store, user) {
        const allowedRoles = this.dataPermissions[store] || [];
        return allowedRoles.includes(user.role);
    },

    setupDataEncryption: function() {
        // Simple encryption for sensitive data (demo purposes)
        this.encryptionKey = 'shikola-pro-2024';
    },

    encryptData: function(data) {
        // Simple XOR encryption for demo
        const dataStr = JSON.stringify(data);
        let encrypted = '';
        for (let i = 0; i < dataStr.length; i++) {
            encrypted += String.fromCharCode(dataStr.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
        }
        return btoa(encrypted);
    },

    decryptData: function(encryptedData) {
        try {
            const decoded = atob(encryptedData);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Error decrypting data:', e);
            return null;
        }
    },

    // Utility methods
    loadInitialData: function() {
        // Load sample data for demo
        this.loadSampleData();
    },

    loadSampleData: function() {
        // Only load sample data if stores are empty
        if (this.dataStores.users.length === 0) {
            this.generateSampleUsers();
        }
        if (this.dataStores.courses.length === 0) {
            this.generateSampleCourses();
        }
        if (this.dataStores.notifications.length === 0) {
            this.generateSampleNotifications();
        }
    },

    generateSampleUsers: function() {
        const sampleUsers = [
            { id: 'admin_001', name: 'System Administrator', email: 'admin@shikola.com', role: 'system-admin', tenantId: null, active: true },
            { id: 'ops_001', name: 'Operations Administrator', email: 'ops@shikola.com', role: 'operations-admin', tenantId: null, active: true },
            { id: 'tenant_001', name: 'Tenant Administrator', email: 'tenant@shikola.com', role: 'tenant-admin', tenantId: 'tenant_001', active: true },
            { id: 'staff_001', name: 'Teacher John', email: 'john@shikola.com', role: 'staff', tenantId: 'tenant_001', active: true },
            { id: 'student_001', name: 'Student Jane', email: 'jane@shikola.com', role: 'student', tenantId: 'tenant_001', active: true },
            { id: 'parent_001', name: 'Parent Bob', email: 'bob@shikola.com', role: 'parent', tenantId: 'tenant_001', active: true }
        ];

        this.saveData('users', sampleUsers, { merge: true, validate: false, sync: false });
    },

    generateSampleCourses: function() {
        const sampleCourses = [
            { id: 'course_001', name: 'Mathematics 101', code: 'MATH101', tenantId: 'tenant_001', credits: 3, active: true },
            { id: 'course_002', name: 'Computer Science 101', code: 'CS101', tenantId: 'tenant_001', credits: 4, active: true },
            { id: 'course_003', name: 'English Literature', code: 'ENG101', tenantId: 'tenant_001', credits: 3, active: true }
        ];

        this.saveData('courses', sampleCourses, { merge: true, validate: false, sync: false });
    },

    generateSampleNotifications: function() {
        const sampleNotifications = [
            { id: 'notif_001', title: 'Welcome to Shikola Pro', message: 'Your account has been created successfully', type: 'info', recipient: 'all', category: 'system' },
            { id: 'notif_002', title: 'System Maintenance', message: 'System will be under maintenance tonight', type: 'warning', recipient: 'all', category: 'system' },
            { id: 'notif_003', title: 'New Course Available', message: 'Computer Science 101 is now available', type: 'success', recipient: 'tenant_001', category: 'academic' }
        ];

        this.saveData('notifications', sampleNotifications, { merge: true, validate: false, sync: false });
    },

    triggerDataUpdate: function(store, data) {
        // Trigger custom event for UI updates
        const event = new CustomEvent('dataUpdate', {
            detail: { store: store, data: data }
        });
        document.dispatchEvent(event);
    },

    logDataAction: function(action, store, data) {
        const log = {
            id: Date.now().toString(),
            action: action,
            entity: store,
            entityId: Array.isArray(data) ? data.map(d => d.id).join(',') : data.id,
            userId: window.rbacSystem?.getCurrentUser()?.id,
            timestamp: new Date().toISOString(),
            details: {
                dataSize: Array.isArray(data) ? data.length : 1,
                userAgent: navigator.userAgent
            }
        };

        this.saveData('audit', log, { merge: true, validate: false, sync: true });
    },

    // Public API methods
    get: function(store, options) {
        return this.fetchData(store, options);
    },

    save: function(store, data, options) {
        return this.saveData(store, data, options);
    },

    delete: function(store, id, options) {
        return this.deleteData(store, id, options);
    },

    sync: function() {
        this.performPeriodicSync();
    },

    clearCache: function(store) {
        if (store) {
            this.clearCache(store);
        } else {
            Object.keys(this.dataStores).forEach(s => this.clearCache(s));
        }
    }
};

// Initialize data management system
document.addEventListener('DOMContentLoaded', () => {
    window.dataManager.init();
});
