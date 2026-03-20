// RBAC and Security Management System
console.log('RBAC Security System loaded');

window.rbacSystem = {
    // Institution context
    currentInstitution: null,
    
    // Role definitions with permissions
    roles: {
        'system-admin': {
            name: 'System Administrator',
            permissions: [
                'system.manage', 'user.manage.all', 'branch.manage.all', 
                'role.manage.all', 'permission.manage.all', 'audit.view',
                'backup.manage', 'security.manage', 'report.view.all',
                'tenant.manage.all', 'settings.system', 'institution.manage.all'
            ],
            level: 100,
            color: '#ef4444',
            description: 'Full system access across all institutions'
        },
        'operations-admin': {
            name: 'Operations Administrator',
            permissions: [
                'subscription.manage', 'billing.manage', 'customer-care.manage',
                'analytics.view', 'system-health.view', 'audit.limited',
                'report.operations', 'settings.operations', 'institution.view.all'
            ],
            level: 80,
            color: '#3b82f6',
            description: 'Operations and billing management across institutions'
        },
        'tenant-admin': {
            name: 'Institution Administrator',
            permissions: [
                'institution.manage.own', 'user.manage.institution', 'department.manage',
                'student.manage', 'staff.manage', 'course.manage',
                'report.institution', 'settings.institution', 'academic.manage'
            ],
            level: 60,
            color: '#8b5cf6',
            description: 'Full management within own institution'
        },
        'staff': {
            name: 'Staff Member',
            permissions: [
                'student.view.own', 'course.view.assigned', 'grade.manage.assigned',
                'attendance.manage.assigned', 'report.limited', 'communication.send',
                'profile.view.own', 'schedule.view.own'
            ],
            level: 40,
            color: '#10b981',
            description: 'Teaching and administrative staff'
        },
        'accountant': {
            name: 'Accountant',
            permissions: [
                'finance.manage', 'tuition.manage', 'financial_reports.view',
                'invoices.manage', 'payments.process', 'report.financial',
                'profile.view.own'
            ],
            level: 45,
            color: '#059669',
            description: 'Financial management and accounting'
        },
        'hr': {
            name: 'HR Manager',
            permissions: [
                'hr.manage', 'recruitment.manage', 'staff_records.manage',
                'payroll.view', 'training.manage', 'report.hr',
                'profile.view.own'
            ],
            level: 45,
            color: '#7c3aed',
            description: 'Human resources management'
        },
        'registry': {
            name: 'Registrar',
            permissions: [
                'registry.manage', 'student_records.manage', 'admissions.manage',
                'transcripts.manage', 'certificates.issue', 'report.registry',
                'profile.view.own'
            ],
            level: 45,
            color: '#dc2626',
            description: 'Student records and registry management'
        },
        'student': {
            name: 'Student',
            permissions: [
                'profile.view.own', 'course.view.enrolled', 'grade.view.own',
                'attendance.view.own', 'assignment.submit', 'communication.receive',
                'schedule.view.own', 'transcripts.request'
            ],
            level: 20,
            color: '#f59e0b',
            description: 'Student access to own academic information'
        },
        'parent': {
            name: 'Parent',
            permissions: [
                'child.view.own', 'grade.view.child', 'attendance.view.child',
                'communication.receive', 'report.child', 'fees.view.child'
            ],
            level: 20,
            color: '#06b6d4',
            description: 'Parent access to children\'s academic information'
        },
        'guest': {
            name: 'Guest',
            permissions: [],
            level: 0,
            color: '#6b7280',
            description: 'Limited access for unauthenticated users'
        }
    },

    // Permission mappings
    permissionMap: {
        // System permissions
        'system.manage': ['system-admin'],
        'user.manage.all': ['system-admin'],
        'branch.manage.all': ['system-admin'],
        'role.manage.all': ['system-admin'],
        'permission.manage.all': ['system-admin'],
        'audit.view': ['system-admin', 'operations-admin'],
        'backup.manage': ['system-admin'],
        'security.manage': ['system-admin'],
        'report.view.all': ['system-admin'],
        'tenant.manage.all': ['system-admin'],
        'settings.system': ['system-admin'],

        // Operations permissions
        'subscription.manage': ['system-admin', 'operations-admin'],
        'billing.manage': ['system-admin', 'operations-admin'],
        'customer-care.manage': ['system-admin', 'operations-admin'],
        'analytics.view': ['system-admin', 'operations-admin'],
        'system-health.view': ['system-admin', 'operations-admin'],
        'audit.limited': ['system-admin', 'operations-admin', 'tenant-admin'],
        'report.operations': ['system-admin', 'operations-admin'],
        'settings.operations': ['system-admin', 'operations-admin'],

        // Tenant permissions
        'tenant.manage.own': ['system-admin', 'tenant-admin'],
        'user.manage.tenant': ['system-admin', 'tenant-admin'],
        'branch.manage.own': ['system-admin', 'tenant-admin'],
        'student.manage': ['system-admin', 'tenant-admin'],
        'staff.manage': ['system-admin', 'tenant-admin'],
        'course.manage': ['system-admin', 'tenant-admin'],
        'report.tenant': ['system-admin', 'tenant-admin'],
        'settings.tenant': ['system-admin', 'tenant-admin'],

        // Staff permissions
        'student.view.own': ['system-admin', 'tenant-admin', 'staff'],
        'course.view.assigned': ['system-admin', 'tenant-admin', 'staff'],
        'grade.manage.assigned': ['system-admin', 'tenant-admin', 'staff'],
        'attendance.manage.assigned': ['system-admin', 'tenant-admin', 'staff'],
        'report.limited': ['system-admin', 'tenant-admin', 'staff'],
        'communication.send': ['system-admin', 'tenant-admin', 'staff'],

        // Student permissions
        'profile.view.own': ['system-admin', 'tenant-admin', 'staff', 'student'],
        'course.view.enrolled': ['system-admin', 'tenant-admin', 'staff', 'student'],
        'grade.view.own': ['system-admin', 'tenant-admin', 'staff', 'student', 'parent'],
        'attendance.view.own': ['system-admin', 'tenant-admin', 'staff', 'student', 'parent'],
        'assignment.submit': ['system-admin', 'tenant-admin', 'staff', 'student'],

        // Parent permissions
        'child.view.own': ['system-admin', 'tenant-admin', 'parent'],
        'communication.receive': ['system-admin', 'tenant-admin', 'staff', 'student', 'parent'],
        'report.child': ['system-admin', 'tenant-admin', 'parent']
    },

    init: function() {
        this.initializeCurrentUser();
        this.setupSecurityChecks();
        this.initializeDataAccess();
    },

    initializeCurrentUser: function() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            // Set default guest user for demo
            this.setCurrentUser({
                id: 'guest_' + Date.now(),
                role: 'guest',
                tenantId: null,
                permissions: []
            });
        }
    },

    setCurrentUser: function(user) {
        const userWithPermissions = {
            ...user,
            permissions: this.roles[user.role]?.permissions || []
        };
        localStorage.setItem('currentUser', JSON.stringify(userWithPermissions));
        console.log('Current user set:', userWithPermissions);
    },

    getCurrentUser: function() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : { role: 'guest', permissions: [] };
    },

    hasPermission: function(permission) {
        const user = this.getCurrentUser();
        return user.permissions.includes(permission);
    },

    hasRole: function(role) {
        const user = this.getCurrentUser();
        return user.role === role;
    },

    canAccessResource: function(resource, action, resourceId = null) {
        const user = this.getCurrentUser();
        const permission = `${resource}.${action}`;
        
        // Check basic permission
        if (!this.hasPermission(permission)) {
            return false;
        }

        // Check resource-level access
        if (resourceId) {
            return this.checkResourceAccess(user, resource, resourceId);
        }

        return true;
    },

    checkResourceAccess: function(user, resource, resourceId) {
        // System admin can access everything
        if (user.role === 'system-admin') return true;

        // Check tenant ownership
        if (resource === 'tenant' || resource === 'branch') {
            return this.checkTenantAccess(user, resourceId);
        }

        // Check user ownership
        if (resource === 'user' || resource === 'student') {
            return this.checkUserAccess(user, resourceId);
        }

        return false;
    },

    checkTenantAccess: function(user, tenantId) {
        if (user.role === 'system-admin') return true;
        if (user.role === 'tenant-admin' && user.tenantId === tenantId) return true;
        if (user.role === 'staff' && user.tenantId === tenantId) return true;
        return false;
    },

    checkUserAccess: function(user, userId) {
        if (user.role === 'system-admin') return true;
        if (user.role === 'tenant-admin' && this.userInTenant(userId, user.tenantId)) return true;
        if (user.role === 'staff' && this.userInTenant(userId, user.tenantId)) return true;
        if (user.id === userId) return true;
        return false;
    },

    userInTenant: function(userId, tenantId) {
        // This would typically check against a database
        // For demo, we'll use localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === userId);
        return user && user.tenantId === tenantId;
    },

    setupSecurityChecks: function() {
        // Intercept navigation
        const originalPushState = history.pushState;
        history.pushState = (...args) => {
            this.checkPageAccess(args[2]);
            originalPushState.apply(history, args);
        };

        // Check current page
        this.checkPageAccess(window.location.pathname);
    },

    checkPageAccess: function(path) {
        const user = this.getCurrentUser();
        const pagePermissions = this.getPagePermissions(path);
        
        const hasAccess = pagePermissions.some(permission => 
            this.hasPermission(permission)
        );

        if (!hasAccess) {
            console.warn('Access denied to page:', path);
            this.redirectToDefaultPage(user.role);
            return false;
        }

        return true;
    },

    getPagePermissions: function(path) {
        const pageMap = {
            '/src/pages/system-admin/': ['system.manage'],
            '/src/pages/operations-admin/': ['subscription.manage'],
            '/src/pages/tenant-admin/': ['tenant.manage.own'],
            '/src/pages/staff/': ['student.view.own'],
            '/src/pages/student/': ['profile.view.own'],
            '/src/pages/parent/': ['child.view.own']
        };

        for (const [pagePath, permissions] of Object.entries(pageMap)) {
            if (path.includes(pagePath)) {
                return permissions;
            }
        }

        return []; // No specific permissions required
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

        const targetPage = rolePages[role] || '/src/pages/signin.html';
        if (window.location.pathname !== targetPage) {
            window.location.href = targetPage;
        }
    },

    initializeDataAccess: function() {
        // Apply row-level security to all tables
        this.applyRowSecurity();
        
        // Filter navigation based on permissions
        this.filterNavigation();
        
        // Hide/show elements based on permissions
        this.filterElements();
    },

    applyRowSecurity: function() {
        const tables = document.querySelectorAll('[data-secure-table]');
        tables.forEach(table => {
            this.secureTable(table);
        });
    },

    secureTable: function(table) {
        const user = this.getCurrentUser();
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const rowOwner = row.dataset.owner;
            const rowTenant = row.dataset.tenant;
            const rowResource = row.dataset.resource || 'user';
            
            if (!this.canAccessRow(user, rowResource, rowOwner, rowTenant)) {
                row.style.display = 'none';
                row.classList.add('access-denied');
            }
        });
    },

    canAccessRow: function(user, resource, owner, tenant) {
        // System admin can access everything
        if (user.role === 'system-admin') return true;

        // Users can access their own data
        if (owner === user.id) return true;

        // Tenant-based access
        if (user.tenantId && tenant === user.tenantId) {
            const tenantRoles = ['tenant-admin', 'staff'];
            if (tenantRoles.includes(user.role)) return true;
        }

        return false;
    },

    filterNavigation: function() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('.html')) {
                const permissions = this.getPagePermissions(href);
                const hasAccess = permissions.some(p => this.hasPermission(p));
                
                if (!hasAccess) {
                    link.style.display = 'none';
                    link.classList.add('access-denied');
                }
            }
        });
    },

    filterElements: function() {
        // Hide elements based on data-permission attributes
        const elements = document.querySelectorAll('[data-permission]');
        elements.forEach(element => {
            const permission = element.dataset.permission;
            if (!this.hasPermission(permission)) {
                element.style.display = 'none';
                element.classList.add('access-denied');
            }
        });

        // Hide elements based on data-role attributes
        const roleElements = document.querySelectorAll('[data-role]');
        roleElements.forEach(element => {
            const requiredRole = element.dataset.role;
            if (!this.hasRole(requiredRole)) {
                element.style.display = 'none';
                element.classList.add('access-denied');
            }
        });
    },

    // Demo functions for testing
    loginAsRole: function(role) {
        const demoUsers = {
            'system-admin': {
                id: 'admin_001',
                role: 'student',
                tenantId: 'tenant_001'
            },
            'parent': {
                id: 'parent_001',
                name: 'Parent',
                email: 'parent@shikola.com',
                role: 'parent',
                tenantId: 'tenant_001'
            }
        };

        const user = demoUsers[role];
        if (user) {
            this.setCurrentUser(user);
            window.location.reload();
        }
    },

    logout: function() {
        localStorage.removeItem('currentUser');
        window.location.href = '/src/pages/signin.html';
    },

    // Utility functions
    getRoleInfo: function(role) {
        return this.roles[role] || this.roles['guest'];
    },

    getAllRoles: function() {
        return Object.keys(this.roles);
    },

    getRolePermissions: function(role) {
        return this.roles[role]?.permissions || [];
    }
};

// Initialize RBAC system
document.addEventListener('DOMContentLoaded', () => {
    window.rbacSystem.init();
});

// Global login functions for demo
window.loginAs = function(role) {
    window.rbacSystem.loginAsRole(role);
};

window.logout = function() {
    window.rbacSystem.logout();
};
