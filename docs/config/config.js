// Configuration File
// Placeholder file to resolve 404 errors
console.log('Config loaded');

window.config = {
    api: {
        baseUrl: 'http://localhost:3000/api',
        timeout: 5000
    },
    
    app: {
        name: 'Shikola Pro',
        version: '1.0.0',
        environment: 'development'
    },
    
    features: {
        tours: true,
        darkMode: true,
        notifications: true
    }
};
