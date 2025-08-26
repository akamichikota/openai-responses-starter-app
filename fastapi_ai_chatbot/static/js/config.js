/**
 * Application configuration
 */

const APP_CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.origin,
    API_TIMEOUT: 30000,
    
    // Chat Configuration
    MAX_MESSAGE_LENGTH: 4000,
    MAX_MESSAGES_PER_SESSION: 1000,
    AUTO_SCROLL_THRESHOLD: 100,
    
    // Storage Keys
    STORAGE_KEYS: {
        USER_SESSION: 'user_session_id',
        CURRENT_SESSION: 'current_chat_session',
        CURRENT_CHATBOT: 'current_chatbot',
        THEME: 'app_theme',
        SETTINGS: 'app_settings',
        SESSIONS_CACHE: 'sessions_cache',
    },
    
    // Default Settings
    DEFAULT_SETTINGS: {
        theme: 'light',
        fontSize: 'medium',
        enableMarkdown: true,
        enableHighlighting: true,
        autoScroll: true,
        virtualScrolling: true,
        progressiveLoading: true,
    },
    
    // Performance Settings
    VIRTUAL_SCROLL: {
        ENABLED: true,
        BUFFER_SIZE: 5,
        ITEM_HEIGHT: 100,
    },
    
    // Progressive Loading
    PROGRESSIVE_LOADING: {
        ENABLED: true,
        BATCH_SIZE: 10,
        DELAY: 100,
    },
    
    // Debounce/Throttle Times
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    
    // Animation Durations
    ANIMATION: {
        FAST: 150,
        BASE: 300,
        SLOW: 500,
    }
};

// Freeze config to prevent modifications
Object.freeze(APP_CONFIG);