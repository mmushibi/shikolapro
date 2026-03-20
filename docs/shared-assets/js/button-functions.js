// Enhanced Button Functions with Auto-Save and Security
console.log('Enhanced Button Functions loaded');

window.buttonFunctions = {
    init: function() {
        console.log('Enhanced button functions initialized');
        this.initializeAutoSave();
        this.initializeSecurity();
        this.bindGlobalEvents();
    },
    
    // Auto-save functionality
    initializeAutoSave: function() {
        // Save form data every 30 seconds
        setInterval(() => {
            this.saveFormData();
        }, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveFormData();
        });
        
        // Restore form data on page load
        this.restoreFormData();
    },
    
    saveFormData: function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formData = new FormData(form);
            const formId = form.id || `form_${Date.now()}`;
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            localStorage.setItem(`form_${formId}`, JSON.stringify(data));
            console.log('Form data auto-saved:', formId);
        });
    },
    
    restoreFormData: function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formId = form.id || `form_${Date.now()}`;
            const savedData = localStorage.getItem(`form_${formId}`);
            
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    Object.keys(data).forEach(key => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = data[key];
                        }
                    });
                    console.log('Form data restored:', formId);
                } catch (e) {
                    console.error('Error restoring form data:', e);
                }
            }
        });
    },
    
    // Security functionality
    initializeSecurity: function() {
        this.checkPermissions();
        this.setupRowSecurity();
    },
    
    checkPermissions: function() {
        const currentUser = this.getCurrentUser();
        const currentPage = window.location.pathname;
        
        // Check if user has access to current page
        if (!this.hasPageAccess(currentUser, currentPage)) {
            console.warn('Access denied for page:', currentPage);
            this.redirectToDefaultPage(currentUser.role);
        }
    },
    
    getCurrentUser: function() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : { role: 'guest', permissions: [] };
    },
    
    hasPageAccess: function(user, page) {
        const rolePermissions = {
            'system-admin': ['system-admin', 'operations-admin', 'tenant-admin', 'staff', 'student', 'parent'],
            'operations-admin': ['operations-admin', 'tenant-admin', 'staff', 'student', 'parent'],
            'tenant-admin': ['tenant-admin', 'staff', 'student', 'parent'],
            'staff': ['staff', 'student', 'parent'],
            'student': ['student'],
            'parent': ['parent'],
            'guest': []
        };
        
        const userRole = user.role || 'guest';
        const allowedPages = rolePermissions[userRole] || [];
        
        return allowedPages.some(pageType => page.includes(pageType));
    },
    
    redirectToDefaultPage: function(role) {
        const rolePages = {
            'system-admin': '/src/pages/system-admin/home.html',
            'operations-admin': '/src/pages/operations-admin/home.html',
            'tenant-admin': '/src/pages/tenant-admin/home.html',
            'staff': '/src/pages/staff/home.html',
            'student': '/src/pages/student/home.html',
            'parent': '/src/pages/parent/home.html',
            'guest': '/src/pages/signin.html'
        };
        
        window.location.href = rolePages[role] || '/src/pages/signin.html';
    },
    
    setupRowSecurity: function() {
        // Add row-level security to data tables
        const tables = document.querySelectorAll('[data-secure-table]');
        tables.forEach(table => {
            this.applyRowSecurity(table);
        });
    },
    
    applyRowSecurity: function(table) {
        const currentUser = this.getCurrentUser();
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const rowOwner = row.dataset.owner;
            const rowTenant = row.dataset.tenant;
            
            // Check if current user can access this row
            if (!this.canAccessRow(currentUser, rowOwner, rowTenant)) {
                row.style.display = 'none';
                row.classList.add('access-denied');
            }
        });
    },
    
    canAccessRow: function(user, rowOwner, rowTenant) {
        // System admin can access everything
        if (user.role === 'system-admin') return true;
        
        // Users can access their own data
        if (rowOwner === user.id) return true;
        
        // Tenant admin can access data from their tenant
        if (user.role === 'tenant-admin' && rowTenant === user.tenantId) return true;
        
        // Staff can access data from their tenant
        if (user.role === 'staff' && rowTenant === user.tenantId) return true;
        
        return false;
    },
    
    // Enhanced button click handling
    handleClick: function(buttonId, action, data = {}) {
        console.log('Button clicked:', buttonId, action, data);
        
        // Check permissions before executing action
        if (!this.hasActionPermission(action)) {
            console.warn('Permission denied for action:', action);
            this.showErrorMessage('You do not have permission to perform this action');
            return false;
        }
        
        // Execute action
        switch (action) {
            case 'add':
                this.handleAddAction(data);
                break;
            case 'edit':
                this.handleEditAction(data);
                break;
            case 'delete':
                this.handleDeleteAction(data);
                break;
            case 'save':
                this.handleSaveAction(data);
                break;
            case 'cancel':
                this.handleCancelAction(data);
                break;
            default:
                console.log('Unknown action:', action);
        }
        
        // Log action for audit
        this.logAction(action, data);
        
        return true;
    },
    
    hasActionPermission: function(action) {
        const currentUser = this.getCurrentUser();
        const actionPermissions = {
            'add': ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            'edit': ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            'delete': ['system-admin', 'operations-admin', 'tenant-admin'],
            'save': ['system-admin', 'operations-admin', 'tenant-admin', 'staff'],
            'cancel': ['system-admin', 'operations-admin', 'tenant-admin', 'staff', 'student', 'parent']
        };
        
        const allowedRoles = actionPermissions[action] || [];
        return allowedRoles.includes(currentUser.role);
    },
    
    handleAddAction: function(data) {
        console.log('Adding new item:', data);
        // Show add modal or form
        this.showAddModal(data);
    },
    
    handleEditAction: function(data) {
        console.log('Editing item:', data);
        // Show edit modal or form
        this.showEditModal(data);
    },
    
    handleDeleteAction: function(data) {
        console.log('Deleting item:', data);
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete this item?')) {
            this.deleteItem(data);
        }
    },
    
    handleSaveAction: function(data) {
        console.log('Saving item:', data);
        // Save data to localStorage
        this.saveItem(data);
        this.showSuccessMessage('Item saved successfully');
    },
    
    handleCancelAction: function(data) {
        console.log('Cancelling action:', data);
        // Close modal or reset form
        this.closeModal();
    },
    
    showAddModal: function(data) {
        const modal = document.getElementById('addModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.log('Add modal not found');
        }
    },
    
    showEditModal: function(data) {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'block';
            // Populate form with data
            this.populateEditForm(data);
        } else {
            console.log('Edit modal not found');
        }
    },
    
    populateEditForm: function(data) {
        Object.keys(data).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    },
    
    deleteItem: function(data) {
        // Remove item from localStorage
        const items = JSON.parse(localStorage.getItem('items') || '[]');
        const filteredItems = items.filter(item => item.id !== data.id);
        localStorage.setItem('items', JSON.stringify(filteredItems));
        
        // Remove from DOM
        const row = document.querySelector(`[data-item-id="${data.id}"]`);
        if (row) {
            row.remove();
        }
        
        this.showSuccessMessage('Item deleted successfully');
    },
    
    saveItem: function(data) {
        // Save to localStorage
        const items = JSON.parse(localStorage.getItem('items') || '[]');
        const existingIndex = items.findIndex(item => item.id === data.id);
        
        if (existingIndex >= 0) {
            items[existingIndex] = data;
        } else {
            items.push(data);
        }
        
        localStorage.setItem('items', JSON.stringify(items));
    },
    
    closeModal: function() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    },
    
    logAction: function(action, data) {
        const log = {
            action: action,
            data: data,
            user: this.getCurrentUser().id,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        };
        
        const logs = JSON.parse(localStorage.getItem('actionLogs') || '[]');
        logs.unshift(log);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.splice(1000);
        }
        
        localStorage.setItem('actionLogs', JSON.stringify(logs));
    },
    
    // UI helper functions
    showSuccessMessage: function(message) {
        this.showNotification(message, 'success');
    },
    
    showErrorMessage: function(message) {
        this.showNotification(message, 'error');
    },
    
    showNotification: function(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            transition: all 0.3s ease;
            ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },
    
    disableButton: function(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        }
    },
    
    enableButton: function(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    },
    
    // Global event binding
    bindGlobalEvents: function() {
        // Bind click events to all buttons with data-action attribute
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                const action = button.dataset.action;
                const data = JSON.parse(button.dataset.data || '{}');
                this.handleClick(button.id, action, data);
            }
        });
        
        // Bind form submit events
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e.target);
        });
    },
    
    handleFormSubmit: function(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        this.handleClick('form-submit', 'save', data);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.buttonFunctions.init();
});
