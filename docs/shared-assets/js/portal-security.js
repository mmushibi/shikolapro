// Portal Security Integration Script
console.log('Portal Security Integration loaded');

window.portalSecurity = {
    init: function() {
        console.log('Initializing portal security...');
        this.setupGlobalSecurity();
        this.setupPortalInterconnection();
        this.setupDataSecurity();
        this.setupAuditLogging();
    },

    setupGlobalSecurity: function() {
        // Ensure RBAC system is loaded
        if (!window.rbacSystem) {
            console.error('RBAC system not loaded');
            return;
        }

        // Check authentication on every page load
        this.checkAuthentication();
        
        // Setup periodic security checks
        setInterval(() => {
            this.checkAuthentication();
            this.validateSession();
        }, 60000); // Every minute
    },

    checkAuthentication: function() {
        const currentUser = window.rbacSystem.getCurrentUser();
        
        // Redirect to login if not authenticated
        if (currentUser.role === 'guest' && !window.location.pathname.includes('/signin.html')) {
            console.warn('Unauthenticated user detected, redirecting to login');
            window.location.href = '/src/pages/signin.html';
            return false;
        }

        return true;
    },

    validateSession: function() {
        const sessionStart = localStorage.getItem('sessionStart');
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        if (sessionStart && Date.now() - parseInt(sessionStart) > sessionTimeout) {
            console.log('Session expired, logging out');
            window.rbacSystem.logout();
        }
    },

    setupPortalInterconnection: function() {
        // Setup cross-portal communication
        this.setupMessageListener();
        this.setupSyncMechanism();
        this.setupSharedState();
    },

    setupMessageListener: function() {
        // Listen for messages from other portals/portals
        window.addEventListener('message', (event) => {
            // Validate message origin
            if (event.origin !== window.location.origin) return;

            const message = event.data;
            if (message.type === 'SECURITY_UPDATE') {
                this.handleSecurityUpdate(message.payload);
            } else if (message.type === 'USER_ACTION') {
                this.handleUserAction(message.payload);
            }
        });
    },

    handleSecurityUpdate: function(payload) {
        console.log('Security update received:', payload);
        
        // Update local security state
        if (payload.userChanged) {
            // Refresh current user data
            window.rbacSystem.init();
        }
        
        if (payload.permissionChanged) {
            // Reapply security filters
            window.rbacSystem.initializeDataAccess();
        }
    },

    handleUserAction: function(payload) {
        console.log('User action received:', payload);
        
        // Log action for audit
        this.logAction({
            action: payload.action,
            user: payload.user,
            portal: payload.portal,
            timestamp: payload.timestamp,
            details: payload.details
        });
    },

    setupSyncMechanism: function() {
        // Sync data across portals
        setInterval(() => {
            this.syncUserData();
            this.syncSecurityState();
        }, 30000); // Every 30 seconds
    },

    syncUserData: function() {
        const currentUser = window.rbacSystem.getCurrentUser();
        
        // Broadcast user data to other portals
        this.broadcastMessage({
            type: 'USER_SYNC',
            payload: {
                user: currentUser,
                timestamp: Date.now()
            }
        });
    },

    syncSecurityState: function() {
        const securityState = {
            permissions: window.rbacSystem.getCurrentUser().permissions,
            role: window.rbacSystem.getCurrentUser().role,
            tenantId: window.rbacSystem.getCurrentUser().tenantId
        };

        this.broadcastMessage({
            type: 'SECURITY_SYNC',
            payload: securityState
        });
    },

    setupSharedState: function() {
        // Setup shared localStorage events
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                console.log('User changed in another portal');
                window.rbacSystem.init();
                this.checkPageAccess();
            } else if (e.key === 'securityBreach') {
                this.handleSecurityBreach(JSON.parse(e.newValue));
            }
        });
    },

    broadcastMessage: function(message) {
        // Send message to all windows/portals
        window.postMessage(message, window.location.origin);
        
        // Store in localStorage for cross-tab communication
        localStorage.setItem('lastMessage', JSON.stringify(message));
    },

    setupDataSecurity: function() {
        // Encrypt sensitive data in localStorage
        this.setupDataEncryption();
        
        // Setup data access logging
        this.setupDataAccessLogging();
        
        // Setup data validation
        this.setupDataValidation();
    },

    setupDataEncryption: function() {
        // Simple encryption for demo (in production, use proper encryption)
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;

        localStorage.setItem = function(key, value) {
            if (key.includes('password') || key.includes('token') || key.includes('secret')) {
                // Encrypt sensitive data
                value = btoa(value); // Base64 encoding for demo
            }
            originalSetItem.call(this, key, value);
        };

        localStorage.getItem = function(key) {
            const value = originalGetItem.call(this, key);
            if (key.includes('password') || key.includes('token') || key.includes('secret')) {
                // Decrypt sensitive data
                try {
                    return atob(value); // Base64 decoding for demo
                } catch (e) {
                    return value;
                }
            }
            return value;
        };
    },

    setupDataAccessLogging: function() {
        // Log all data access
        const originalGetItem = localStorage.getItem;
        const originalSetItem = localStorage.setItem;

        localStorage.getItem = function(key) {
            const value = originalGetItem.call(this, key);
            window.portalSecurity.logDataAccess('read', key, value);
            return value;
        };

        localStorage.setItem = function(key, value) {
            window.portalSecurity.logDataAccess('write', key, value);
            originalSetItem.call(this, key, value);
        };
    },

    logDataAccess: function(action, key, value) {
        const log = {
            action: action,
            key: key,
            timestamp: Date.now(),
            user: window.rbacSystem.getCurrentUser().id,
            portal: window.location.pathname
        };

        const logs = JSON.parse(localStorage.getItem('dataAccessLogs') || '[]');
        logs.unshift(log);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.splice(1000);
        }
        
        localStorage.setItem('dataAccessLogs', JSON.stringify(logs));
    },

    setupDataValidation: function() {
        // Validate data integrity
        setInterval(() => {
            this.validateDataIntegrity();
        }, 60000); // Every minute
    },

    validateDataIntegrity: function() {
        const criticalKeys = ['currentUser', 'sessionStart', 'actionLogs'];
        
        criticalKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    JSON.parse(value);
                } catch (e) {
                    console.error('Data integrity violation for key:', key);
                    this.handleSecurityBreach({
                        type: 'DATA_CORRUPTION',
                        key: key,
                        timestamp: Date.now()
                    });
                }
            }
        });
    },

    setupAuditLogging: function() {
        // Setup comprehensive audit logging
        this.logPageAccess();
        this.logUserActions();
        this.logSecurityEvents();
    },

    logPageAccess: function() {
        const log = {
            event: 'PAGE_ACCESS',
            page: window.location.pathname,
            user: window.rbacSystem.getCurrentUser().id,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };

        this.writeAuditLog(log);
    },

    logUserActions: function() {
        // Log all button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button) {
                const log = {
                    event: 'BUTTON_CLICK',
                    buttonId: button.id,
                    buttonText: button.textContent,
                    action: button.dataset.action,
                    user: window.rbacSystem.getCurrentUser().id,
                    timestamp: Date.now(),
                    page: window.location.pathname
                };

                this.writeAuditLog(log);
            }
        });

        // Log form submissions
        document.addEventListener('submit', (e) => {
            const log = {
                event: 'FORM_SUBMIT',
                formId: e.target.id,
                formAction: e.target.action,
                user: window.rbacSystem.getCurrentUser().id,
                timestamp: Date.now(),
                page: window.location.pathname
            };

            this.writeAuditLog(log);
        });
    },

    logSecurityEvents: function() {
        // Log security-related events
        window.addEventListener('error', (e) => {
            const log = {
                event: 'JAVASCRIPT_ERROR',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                user: window.rbacSystem.getCurrentUser().id,
                timestamp: Date.now(),
                page: window.location.pathname
            };

            this.writeAuditLog(log);
        });

        window.addEventListener('unhandledrejection', (e) => {
            const log = {
                event: 'UNHANDLED_PROMISE_REJECTION',
                reason: e.reason,
                user: window.rbacSystem.getCurrentUser().id,
                timestamp: Date.now(),
                page: window.location.pathname
            };

            this.writeAuditLog(log);
        });
    },

    writeAuditLog: function(log) {
        const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        logs.unshift(log);
        
        // Keep only last 10000 logs
        if (logs.length > 10000) {
            logs.splice(10000);
        }
        
        localStorage.setItem('auditLogs', JSON.stringify(logs));
    },

    logAction: function(action) {
        const log = {
            event: 'USER_ACTION',
            ...action,
            timestamp: Date.now()
        };

        this.writeAuditLog(log);
    },

    checkPageAccess: function() {
        const hasAccess = window.rbacSystem.checkPageAccess(window.location.pathname);
        if (!hasAccess) {
            console.warn('Access denied to page:', window.location.pathname);
            window.rbacSystem.redirectToDefaultPage(window.rbacSystem.getCurrentUser().role);
        }
    },

    handleSecurityBreach: function(breach) {
        console.error('Security breach detected:', breach);
        
        // Log the breach
        this.writeAuditLog({
            event: 'SECURITY_BREACH',
            breach: breach,
            timestamp: Date.now()
        });

        // Notify other portals
        localStorage.setItem('securityBreach', JSON.stringify(breach));
        
        // Take appropriate action
        if (breach.type === 'DATA_CORRUPTION') {
            // Clear corrupted data
            localStorage.removeItem(breach.key);
        } else if (breach.type === 'UNAUTHORIZED_ACCESS') {
            // Log out user
            window.rbacSystem.logout();
        }
    },

    // Utility functions
    getCurrentPortal: function() {
        const path = window.location.pathname;
        if (path.includes('system-admin')) return 'system-admin';
        if (path.includes('operations-admin')) return 'operations-admin';
        if (path.includes('tenant-admin')) return 'tenant-admin';
        if (path.includes('staff')) return 'staff';
        if (path.includes('student')) return 'student';
        if (path.includes('parent')) return 'parent';
        return 'unknown';
    },

    getSecurityStatus: function() {
        const currentUser = window.rbacSystem.getCurrentUser();
        return {
            authenticated: currentUser.role !== 'guest',
            user: currentUser,
            portal: this.getCurrentPortal(),
            sessionStart: localStorage.getItem('sessionStart'),
            lastActivity: localStorage.getItem('lastActivity'),
            securityLevel: this.getSecurityLevel(currentUser.role)
        };
    },

    getSecurityLevel: function(role) {
        const levels = {
            'system-admin': 'HIGH',
            'operations-admin': 'HIGH',
            'tenant-admin': 'MEDIUM',
            'staff': 'MEDIUM',
            'student': 'LOW',
            'parent': 'LOW',
            'guest': 'NONE'
        };
        return levels[role] || 'NONE';
    }
};

// Initialize portal security
document.addEventListener('DOMContentLoaded', () => {
    window.portalSecurity.init();
    
    // Update session activity
    localStorage.setItem('sessionStart', Date.now().toString());
    setInterval(() => {
        localStorage.setItem('lastActivity', Date.now().toString());
    }, 30000);
});
