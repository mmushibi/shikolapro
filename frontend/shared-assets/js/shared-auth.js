// Shared Authentication
// Placeholder file to resolve 404 errors
console.log('Shared Auth loaded');

window.sharedAuth = {
    init: function() {
        console.log('Auth system initialized');
    },
    
    login: function(credentials) {
        console.log('Login attempt:', credentials);
        return Promise.resolve({ success: true });
    },
    
    logout: function() {
        console.log('Logout');
        return Promise.resolve({ success: true });
    },
    
    isAuthenticated: function() {
        return true;
    }
};

// Global Logout Function
async function logout() {
    try {
        // Clear session storage
        sessionStorage.clear();
        
        // Clear local storage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('authToken');
        
        // Call API logout if available
        if (window.sharedApiClient && window.sharedApiClient.logout) {
            await window.sharedApiClient.logout();
        }
        
        // Redirect to sign in page - use relative path for better compatibility
        const currentPath = window.location.pathname;
        if (currentPath.includes('/system-admin/')) {
            window.location.href = '../../pages/signin.html';
        } else if (currentPath.includes('/tenant-admin/')) {
            window.location.href = '../../pages/signin.html';
        } else {
            window.location.href = '../pages/signin.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if API call fails
        const currentPath = window.location.pathname;
        if (currentPath.includes('/system-admin/')) {
            window.location.href = '../../pages/signin.html';
        } else if (currentPath.includes('/tenant-admin/')) {
            window.location.href = '../../pages/signin.html';
        } else {
            window.location.href = '../pages/signin.html';
        }
    }
}

// Attach to window object for global access
window.logout = logout;

// Listen for Alpine.js logout events
document.addEventListener('alpine:initialized', () => {
    document.addEventListener('logout', () => {
        logout();
    });
});

// Fallback if Alpine is already initialized
if (window.Alpine) {
    document.addEventListener('logout', () => {
        logout();
    });
}
