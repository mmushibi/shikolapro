// Comprehensive Notification and Messaging System
console.log('Enhanced Notification System loaded');

window.sharedMessages = {
    init: function() {
        console.log('Notification system initialized');
        this.setupNotificationStorage();
        this.setupNotificationListeners();
        this.setupRealtimeSync();
        this.loadExistingNotifications();
    },

    // Storage setup
    setupNotificationStorage: function() {
        if (!localStorage.getItem('notifications')) {
            localStorage.setItem('notifications', JSON.stringify([]));
        }
        if (!localStorage.getItem('notificationSettings')) {
            localStorage.setItem('notificationSettings', JSON.stringify(this.getDefaultSettings()));
        }
        // Load notifications from database
        this.loadNotificationsFromDB();
    },

    getDefaultSettings: function() {
        return {
            email: true,
            sms: false,
            push: true,
            system: true,
            academic: true,
            financial: true,
            security: true,
            communication: true
        };
    },

    // Notification listeners
    setupNotificationListeners: function() {
        // Listen for storage changes (cross-tab notifications)
        window.addEventListener('storage', (e) => {
            if (e.key === 'notifications') {
                this.loadExistingNotifications();
                this.showNotificationBadge();
            } else if (e.key === 'notificationBroadcast') {
                // Handle broadcast from other tabs
                try {
                    const broadcastData = JSON.parse(e.newValue);
                    if (broadcastData.type === 'NOTIFICATION_UPDATE') {
                        this.handleNotificationUpdate(broadcastData.payload);
                    }
                } catch (error) {
                    console.log('Error parsing broadcast data:', error);
                }
            }
        });

        // Listen for messages from other portals/windows
        window.addEventListener('message', (e) => {
            if (e.data.type === 'NOTIFICATION_UPDATE') {
                this.handleNotificationUpdate(e.data.payload);
            } else if (e.data.type === 'NOTIFICATION_SYNC') {
                // Sync notifications from other window
                if (e.data.payload.userId !== this.getCurrentUser()?.id) {
                    this.loadNotificationsFromDB();
                }
            }
        });
    },

    setupRealtimeSync: function() {
        // Sync notifications every 30 seconds
        setInterval(() => {
            this.syncNotifications();
        }, 30000);

        // Broadcast notifications to other portals
        setInterval(() => {
            this.broadcastNotifications();
        }, 10000);
        
        // Real-time sync with database every 5 seconds
        setInterval(() => {
            this.loadNotificationsFromDB();
        }, 5000);
    },

    // Database functions
    loadNotificationsFromDB: function() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            fetch('/api/data/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    const dbNotifications = data.data;
                    const localNotifications = this.getNotifications();
                    
                    // Merge notifications, keeping the most recent
                    const mergedNotifications = this.mergeNotifications(dbNotifications, localNotifications);
                    localStorage.setItem('notifications', JSON.stringify(mergedNotifications));
                    this.showNotificationBadge();
                }
            })
            .catch(error => {
                console.log('Error loading notifications from DB:', error);
                // Fallback to localStorage only
            });
        } catch (error) {
            console.log('Error in loadNotificationsFromDB:', error);
        }
    },

    saveNotificationToDB: function(notification) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return false;
            
            return fetch('/api/data/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    data: notification
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Notification saved to database:', notification);
                    return true;
                } else {
                    console.error('Failed to save notification to DB:', data);
                    return false;
                }
            })
            .catch(error => {
                console.error('Error saving notification to DB:', error);
                return false;
            });
        } catch (error) {
            console.error('Error in saveNotificationToDB:', error);
            return false;
        }
    },

    mergeNotifications: function(dbNotifications, localNotifications) {
        const notificationMap = new Map();
        
        // Add DB notifications first
        dbNotifications.forEach(n => {
            notificationMap.set(n.id, n);
        });
        
        // Add/overwrite with local notifications (they might be newer)
        localNotifications.forEach(n => {
            notificationMap.set(n.id, n);
        });
        
        // Convert back to array and sort by timestamp
        return Array.from(notificationMap.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 1000); // Keep only latest 1000
    },

    // Core notification methods
    sendNotification: function(options) {
        const notification = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: options.title || 'Notification',
            message: options.message || '',
            type: options.type || 'info',
            priority: options.priority || 'normal',
            recipient: options.recipient || 'all',
            sender: options.sender || this.getCurrentUser()?.id,
            timestamp: new Date().toISOString(),
            read: false,
            category: options.category || 'system',
            data: options.data || {},
            expiresAt: options.expiresAt || null
        };

        // Check if user can send this type of notification
        if (!this.canSendNotification(notification)) {
            console.warn('Permission denied: Cannot send notification');
            return false;
        }

        // Add to local storage
        this.addNotification(notification);

        // Save to database for persistence
        this.saveNotificationToDB(notification);

        // Send to specific users or broadcast
        this.deliverNotification(notification);

        console.log('Notification sent:', notification);
        return true;
    },

    addNotification: function(notification) {
        const notifications = this.getNotifications();
        notifications.unshift(notification);

        // Keep only last 1000 notifications
        if (notifications.length > 1000) {
            notifications.splice(1000);
        }

        localStorage.setItem('notifications', JSON.stringify(notifications));

        // Trigger UI update
        this.showNotificationBadge();
        
        // Broadcast to other tabs immediately
        this.broadcastNotificationUpdate(notification);
    },

    broadcastNotificationUpdate: function(notification) {
        const broadcastData = {
            type: 'NOTIFICATION_UPDATE',
            payload: notification,
            timestamp: Date.now()
        };

        // Send via localStorage for cross-tab communication
        localStorage.setItem('notificationBroadcast', JSON.stringify(broadcastData));
        
        // Send via postMessage to other windows
        window.postMessage(broadcastData, '*');
        
        // Clear broadcast after a short delay
        setTimeout(() => {
            localStorage.removeItem('notificationBroadcast');
        }, 1000);
    },

    deliverNotification: function(notification) {
        const currentUser = this.getCurrentUser();

        // Check if current user should receive this notification
        if (this.shouldReceiveNotification(notification, currentUser)) {
            // Show in current portal
            this.displayNotification(notification);

            // Send via configured channels
            this.sendViaChannels(notification);
        }

        // Broadcast to other portals/users
        this.broadcastToRecipients(notification);
    },

    shouldReceiveNotification: function(notification, user) {
        // System notifications go to all users
        if (notification.recipient === 'all') return true;

        // Check if notification is for this user
        if (notification.recipient === user?.id) return true;

        // Check tenant-based notifications
        if (notification.recipient === 'tenant' && notification.tenantId === user?.tenantId) return true;

        // Check role-based notifications
        if (Array.isArray(notification.recipient) && notification.recipient.includes(user?.role)) return true;

        return false;
    },

    displayNotification: function(notification) {
        // Create notification element
        const notificationEl = this.createNotificationElement(notification);
        document.body.appendChild(notificationEl);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.remove();
            }
        }, 5000);
    },

    createNotificationElement: function(notification) {
        const el = document.createElement('div');
        el.className = `fixed top-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 translate-x-full`;

        // Set border color based on type
        const borderColors = {
            success: 'border-green-500',
            error: 'border-red-500',
            warning: 'border-yellow-500',
            info: 'border-blue-500'
        };
        el.classList.add(borderColors[notification.type] || 'border-blue-500');

        el.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas ${this.getNotificationIcon(notification.type)} text-lg"></i>
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                    <p class="text-sm text-gray-500">${notification.message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        // Animate in
        setTimeout(() => {
            el.classList.remove('translate-x-full');
            el.classList.add('translate-x-0');
        }, 100);

        return el;
    },

    getNotificationIcon: function(type) {
        const icons = {
            success: 'fa-check-circle text-green-500',
            error: 'fa-exclamation-circle text-red-500',
            warning: 'fa-exclamation-triangle text-yellow-500',
            info: 'fa-info-circle text-blue-500'
        };
        return icons[type] || 'fa-bell text-blue-500';
    },

    sendViaChannels: function(notification) {
        const settings = this.getNotificationSettings();

        // Simulate sending via different channels
        if (settings.email) {
            console.log('Sending email notification:', notification.title);
        }
        if (settings.sms) {
            console.log('Sending SMS notification:', notification.title);
        }
        if (settings.push) {
            console.log('Sending push notification:', notification.title);
        }
    },

    broadcastToRecipients: function(notification) {
        // Send to other portals via localStorage
        const broadcastData = {
            type: 'NOTIFICATION_UPDATE',
            payload: notification,
            timestamp: Date.now()
        };

        localStorage.setItem('notificationBroadcast', JSON.stringify(broadcastData));

        // Send via postMessage to other windows
        window.postMessage(broadcastData, '*');
    },

    // Notification management
    getNotifications: function() {
        try {
            return JSON.parse(localStorage.getItem('notifications') || '[]');
        } catch (e) {
            console.error('Error parsing notifications:', e);
            return [];
        }
    },

    getUnreadCount: function() {
        return this.getNotifications().filter(n => !n.read).length;
    },

    markAsRead: function(notificationId) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem('notifications', JSON.stringify(notifications));
            this.showNotificationBadge();
        }
    },

    markAllAsRead: function() {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.read = true);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        this.showNotificationBadge();
    },

    deleteNotification: function(notificationId) {
        const notifications = this.getNotifications().filter(n => n.id !== notificationId);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        this.showNotificationBadge();
    },

    clearAllNotifications: function() {
        localStorage.setItem('notifications', JSON.stringify([]));
        this.showNotificationBadge();
    },

    // UI helpers
    showNotificationBadge: function() {
        const badges = document.querySelectorAll('.notification-badge');
        const count = this.getUnreadCount();

        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    },

    loadExistingNotifications: function() {
        // Update any notification UI components
        this.showNotificationBadge();
    },

    // Permission checking
    canSendNotification: function(notification) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        // System admin can send all notifications
        if (currentUser.role === 'system-admin') return true;

        // Operations admin can send operational notifications
        if (currentUser.role === 'operations-admin' &&
            ['system', 'operational', 'billing'].includes(notification.category)) {
            return true;
        }

        // Tenant admin can send tenant-related notifications
        if (currentUser.role === 'tenant-admin' &&
            ['academic', 'system', 'communication'].includes(notification.category)) {
            return true;
        }

        // Staff can send limited notifications
        if (currentUser.role === 'staff' &&
            ['academic', 'communication'].includes(notification.category)) {
            return true;
        }

        // Students can send communication notifications (to teachers/parents)
        if (currentUser.role === 'student' &&
            ['communication'].includes(notification.category)) {
            return true;
        }

        // Parents can send communication notifications (to teachers/staff)
        if (currentUser.role === 'parent' &&
            ['communication'].includes(notification.category)) {
            return true;
        }

        return false;
    },

    // Settings management
    getNotificationSettings: function() {
        try {
            return JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        } catch (e) {
            return this.getDefaultSettings();
        }
    },

    updateNotificationSettings: function(settings) {
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
    },

    // Utility functions
    getCurrentUser: function() {
        if (window.rbacSystem) {
            return window.rbacSystem.getCurrentUser();
        }
        return null;
    },

    handleNotificationUpdate: function(notification) {
        const currentUser = this.getCurrentUser();
        if (this.shouldReceiveNotification(notification, currentUser)) {
            this.addNotification(notification);
            this.displayNotification(notification);
        }
    },

    syncNotifications: function() {
        // Sync with server (placeholder for future implementation)
        console.log('Syncing notifications...');
    },

    broadcastNotifications: function() {
        const notifications = this.getNotifications();
        const broadcastData = {
            type: 'NOTIFICATION_SYNC',
            payload: {
                notifications: notifications,
                userId: this.getCurrentUser()?.id
            },
            timestamp: Date.now()
        };

        window.postMessage(broadcastData, '*');
    },

    // Bulk operations
    sendBulkNotification: function(options) {
        const { recipients, ...notificationOptions } = options;

        recipients.forEach(recipient => {
            this.sendNotification({
                ...notificationOptions,
                recipient: recipient
            });
        });
    },

    sendRoleNotification: function(role, options) {
        this.sendNotification({
            ...options,
            recipient: role
        });
    },

    sendTenantNotification: function(tenantId, options) {
        this.sendNotification({
            ...options,
            recipient: 'tenant',
            tenantId: tenantId
        });
    },

    // Convenience methods for different user roles
    notifySystemAdmin: function(title, message, options = {}) {
        this.sendRoleNotification('system-admin', {
            title,
            message,
            type: 'warning',
            category: 'system',
            ...options
        });
    },

    notifyOperationsAdmin: function(title, message, options = {}) {
        this.sendRoleNotification('operations-admin', {
            title,
            message,
            type: 'info',
            category: 'operational',
            ...options
        });
    },

    notifyTenantAdmin: function(title, message, options = {}) {
        this.sendRoleNotification('tenant-admin', {
            title,
            message,
            type: 'success',
            category: 'academic',
            ...options
        });
    },

    notifyStaff: function(title, message, options = {}) {
        this.sendRoleNotification('staff', {
            title,
            message,
            type: 'info',
            category: 'academic',
            ...options
        });
    },

    notifyStudents: function(title, message, options = {}) {
        this.sendRoleNotification('student', {
            title,
            message,
            type: 'info',
            category: 'academic',
            ...options
        });
    },

    notifyParents: function(title, message, options = {}) {
        this.sendRoleNotification('parent', {
            title,
            message,
            type: 'info',
            category: 'communication',
            ...options
        });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.sharedMessages.init();
});
