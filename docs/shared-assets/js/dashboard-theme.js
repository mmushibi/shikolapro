// Dashboard Theme Manager
// Placeholder file to resolve 404 errors
console.log('Dashboard Theme loaded');

window.dashboardTheme = {
    init: function() {
        console.log('Theme manager initialized');
    },
    
    setTheme: function(theme) {
        console.log('Setting theme:', theme);
        document.body.className = theme;
    },
    
    toggleDarkMode: function() {
        console.log('Toggling dark mode');
        document.body.classList.toggle('dark-mode');
    }
};
