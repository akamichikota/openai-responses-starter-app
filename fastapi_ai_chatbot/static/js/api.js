/**
 * API communication manager
 */

class APIManager {
    constructor() {
        this.baseURL = APP_CONFIG.API_BASE_URL;
        this.eventSource = null;
        this.abortController = null;
    }
    
    /**
     * Make API request
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };
        
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            config.body = JSON.stringify(data);
        }
        
        // Add abort controller for timeout
        this.abortController = new AbortController();
        config.signal = this.abortController.signal;
        
        // Set timeout
        const timeoutId = setTimeout(() => {
            if (this.abortController) {
                this.abortController.abort();
            }
        }, APP_CONFIG.API_TIMEOUT);
        
        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw err;
        }
    }
    
    /**
     * Stream chat messages
     */
    async streamChat(sessionId, message, onMessage, onError, onComplete) {
        console.log('🚀 Starting stream chat:', { sessionId, message });
        const endpoint = '/api/chat/stream';
        const data = {
            session_id: sessionId,
            message: message,
            tools: []
        };
        
        try {
            console.log('📤 Sending stream request to:', `${this.baseURL}${endpoint}`);
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            console.log('📥 Stream response status:', response.status);
            console.log('📥 Stream response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Stream response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        console.log('📡 Raw SSE data:', dataStr);
                        
                        if (dataStr === '[DONE]' || dataStr === 'data: [DONE]') {
                            console.log('📡 Stream completed with [DONE]');
                            onComplete?.();
                            return;
                        }
                        
                        if (dataStr) {
                            try {
                                // Handle nested "data: " prefix
                                let actualData = dataStr;
                                while (actualData.startsWith('data: ')) {
                                    actualData = actualData.slice(6);
                                }
                                
                                // Skip empty lines
                                if (!actualData.trim()) {
                                    continue;
                                }
                                
                                const event = JSON.parse(actualData);
                                console.log('📡 Parsed SSE event:', event);
                                onMessage(event);
                            } catch (err) {
                                console.error('Error parsing SSE data:', err, 'Raw data:', dataStr);
                            }
                        }
                    }
                }
            }
            
            onComplete?.();
        } catch (err) {
            onError?.(err);
        }
    }
    
    /**
     * Get chatbots
     */
    async getChatbots(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/api/chatbots${queryString ? `?${queryString}` : ''}`;
        return this.request('GET', endpoint);
    }
    
    /**
     * Get chatbot by ID
     */
    async getChatbot(chatbotId) {
        try {
            return await this.request('GET', `/api/chatbots/${chatbotId}`);
        } catch (error) {
            // If specific chatbot not found, try to find in cached list
            const cachedChatbots = window.cachedChatbots || [];
            const chatbot = cachedChatbots.find(c => c.id === chatbotId);
            if (chatbot) {
                return chatbot;
            }
            throw error;
        }
    }
    
    /**
     * Create chat session
     */
    async createSession(chatbotId, name = null) {
        return this.request('POST', '/api/chat/sessions', {
            chatbot_id: chatbotId,
            name: name
        });
    }
    
    /**
     * Get chat sessions
     */
    async getSessions(limit = 50, offset = 0) {
        return this.request('GET', `/api/chat/sessions?limit=${limit}&offset=${offset}`);
    }
    
    /**
     * Get session details
     */
    async getSession(sessionId) {
        return this.request('GET', `/api/chat/sessions/${sessionId}`);
    }
    
    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        return this.request('DELETE', `/api/chat/sessions/${sessionId}`);
    }
    
    /**
     * Bulk delete all sessions
     */
    async bulkDeleteSessions() {
        return this.request('DELETE', '/api/chat/sessions/bulk-delete');
    }
    
    /**
     * Export session
     */
    async exportSession(sessionId, format = 'json') {
        return this.request('GET', `/api/chat/sessions/${sessionId}/export?format=${format}`);
    }
    
    /**
     * Cancel current request
     */
    cancelRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// Create global API instance
const API = new APIManager();