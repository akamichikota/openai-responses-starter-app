/**
 * Main application initialization - NextJS style
 */

// Application state
const AppState = {
    isInitialized: false,
    currentTheme: 'light',
    isMobileMenuOpen: false,
    currentPage: 'chat'
};

/**
 * Initialize the application
 */
async function initApp() {
    try {
        console.log('🚀 Initializing AI Chat Platform (NextJS Style)...');
        
        // Initialize storage
        Storage.init();
        
        // Initialize UI components
        UI.init();
        
        // Initialize chat manager
        await Chat.init();
        
        // Mark as initialized
        AppState.isInitialized = true;
        
        console.log('✅ Application initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        alert('Failed to initialize application: ' + error.message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Export for debugging
window.AppState = AppState;
window.initApp = initApp;
window.Chat = Chat;
window.API = API;
window.Storage = Storage;
window.UI = UI;
window.Utils = Utils;