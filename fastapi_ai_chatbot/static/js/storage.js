/**
 * Storage management
 */

class StorageManager {
    constructor() {
        this.storage = window.localStorage;
        this.sessionStorage = window.sessionStorage;
    }
    
    /**
     * Initialize storage
     */
    init() {
        // Ensure default settings exist
        if (!this.get(APP_CONFIG.STORAGE_KEYS.SETTINGS)) {
            this.set(APP_CONFIG.STORAGE_KEYS.SETTINGS, APP_CONFIG.DEFAULT_SETTINGS);
        }
        
        // Initialize theme
        const theme = this.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        
        console.log('Storage initialized');
    }
    
    /**
     * Get item from storage
     */
    get(key) {
        try {
            const item = this.storage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (err) {
            console.error('Storage get error:', err);
            return null;
        }
    }
    
    /**
     * Set item in storage
     */
    set(key, value) {
        try {
            this.storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error('Storage set error:', err);
            return false;
        }
    }
    
    /**
     * Remove item from storage
     */
    remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (err) {
            console.error('Storage remove error:', err);
            return false;
        }
    }
    
    /**
     * Clear all storage
     */
    clear() {
        try {
            this.storage.clear();
            return true;
        } catch (err) {
            console.error('Storage clear error:', err);
            return false;
        }
    }
    
    /**
     * Get user session ID
     */
    getUserSessionId() {
        let sessionId = this.get(APP_CONFIG.STORAGE_KEYS.USER_SESSION);
        if (!sessionId) {
            sessionId = Utils.generateId();
            this.set(APP_CONFIG.STORAGE_KEYS.USER_SESSION, sessionId);
            Utils.setCookie('user_session_id', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Get current chat session
     */
    getCurrentSession() {
        return this.get(APP_CONFIG.STORAGE_KEYS.CURRENT_SESSION);
    }
    
    /**
     * Set current chat session
     */
    setCurrentSession(session) {
        return this.set(APP_CONFIG.STORAGE_KEYS.CURRENT_SESSION, session);
    }
    
    /**
     * Get current chatbot
     */
    getCurrentChatbot() {
        return this.get(APP_CONFIG.STORAGE_KEYS.CURRENT_CHATBOT);
    }
    
    /**
     * Set current chatbot
     */
    setCurrentChatbot(chatbot) {
        return this.set(APP_CONFIG.STORAGE_KEYS.CURRENT_CHATBOT, chatbot);
    }
    
    /**
     * Get app settings
     */
    getSettings() {
        const settings = this.get(APP_CONFIG.STORAGE_KEYS.SETTINGS);
        return settings || APP_CONFIG.DEFAULT_SETTINGS;
    }
    
    /**
     * Update settings
     */
    updateSettings(updates) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...updates };
        return this.set(APP_CONFIG.STORAGE_KEYS.SETTINGS, newSettings);
    }
    
    /**
     * Save settings (alias for updateSettings)
     */
    saveSettings(settings) {
        return this.set(APP_CONFIG.STORAGE_KEYS.SETTINGS, settings);
    }
    
    /**
     * Get theme
     */
    getTheme() {
        return this.get(APP_CONFIG.STORAGE_KEYS.THEME) || 'light';
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        this.set(APP_CONFIG.STORAGE_KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    /**
     * Get cached sessions
     */
    getCachedSessions() {
        return this.get(APP_CONFIG.STORAGE_KEYS.SESSIONS_CACHE) || [];
    }
    
    /**
     * Cache sessions
     */
    cacheSessions(sessions) {
        return this.set(APP_CONFIG.STORAGE_KEYS.SESSIONS_CACHE, sessions);
    }
    
    /**
     * Add message to session cache
     */
    addMessageToCache(sessionId, message) {
        // Get or create session messages cache
        const sessionMessagesKey = `session_messages_${sessionId}`;
        let messages = this.get(sessionMessagesKey) || [];
        
        // Add new message
        messages.push({
            ...message,
            id: message.id || `msg_${Utils.generateId()}`,
            timestamp: message.timestamp || new Date().toISOString()
        });
        
        // Save messages back to storage
        this.set(sessionMessagesKey, messages);
        
        // Update session metadata if it exists
        const sessions = this.getCachedSessions();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex !== -1) {
            sessions[sessionIndex].message_count = messages.length;
            sessions[sessionIndex].last_activity = new Date().toISOString();
            this.cacheSessions(sessions);
        }
        
        console.log(`💾 Cached message for session ${sessionId}, total: ${messages.length}`);
    }
    
    /**
     * Get cached messages for a session
     */
    getCachedMessages(sessionId) {
        const sessionMessagesKey = `session_messages_${sessionId}`;
        return this.get(sessionMessagesKey) || [];
    }
    
    /**
     * Clear cached messages for a session
     */
    clearCachedMessages(sessionId) {
        const sessionMessagesKey = `session_messages_${sessionId}`;
        this.remove(sessionMessagesKey);
    }
    
    /**
     * Get storage usage
     */
    getStorageUsage() {
        let total = 0;
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                total += this.storage[key].length + key.length;
            }
        }
        return total;
    }
    
    /**
     * Export all data
     */
    exportData() {
        const data = {};
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                try {
                    data[key] = JSON.parse(this.storage[key]);
                } catch {
                    data[key] = this.storage[key];
                }
            }
        }
        return data;
    }
    
    /**
     * Import data
     */
    importData(data) {
        try {
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            return true;
        } catch (err) {
            console.error('Import error:', err);
            return false;
        }
    }
}

// Create global storage instance
const Storage = new StorageManager();