/**
 * Chat management
 */

class ChatManager {
    constructor() {
        this.currentSession = null;
        this.currentChatbot = null;
        this.messages = [];
        this.isStreaming = false;
        this.isComposing = false;
        this.currentStreamingMessage = null;
        this.currentContent = '';
    }
    
    /**
     * Initialize chat
     */
    async init() {
        // Load current session and chatbot from storage
        this.currentSession = Storage.getCurrentSession();
        this.currentChatbot = Storage.getCurrentChatbot();
        
        if (this.currentSession && this.currentChatbot) {
            await this.loadSession(this.currentSession.id);
        }
        
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const clearButton = document.getElementById('clear-chat-btn');
        const exportButton = document.getElementById('export-chat-btn');
        
        // Message input events
        messageInput.addEventListener('input', (e) => {
            this.handleInputChange(e);
        });
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !this.isComposing) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // IME composition events
        messageInput.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });
        
        messageInput.addEventListener('compositionend', () => {
            this.isComposing = false;
        });
        
        // Send button
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Clear chat
        clearButton?.addEventListener('click', () => {
            this.clearChat();
        });
        
        // Export chat
        exportButton?.addEventListener('click', () => {
            this.exportChat();
        });
    }
    
    /**
     * Handle input change
     */
    handleInputChange(event) {
        const input = event.target;
        const charCount = document.getElementById('char-count');
        const sendButton = document.getElementById('send-button');
        
        // Update character count
        charCount.textContent = `${input.value.length}/${APP_CONFIG.MAX_MESSAGE_LENGTH}`;
        
        // Auto resize textarea
        Utils.autoResizeTextarea(input);
        
        // Enable/disable send button
        sendButton.disabled = !input.value.trim() || this.isStreaming;
    }
    
    /**
     * Send message
     */
    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || this.isStreaming) return;
        
        if (!this.currentSession || !this.currentChatbot) {
            UI.showNotification('Please select a chatbot first', 'warning');
            return;
        }
        
        // Clear input
        input.value = '';
        this.handleInputChange({ target: input });
        
        // Add user message
        this.addMessage({
            id: Utils.generateId(),
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
        
        // Start streaming
        this.isStreaming = true;
        this.updateStreamingState(true);
        
        // Reset streaming state
        this.currentStreamingMessage = null;
        this.currentContent = '';
        
        try {
            await API.streamChat(
                this.currentSession.id,
                message,
                // onMessage
                (event) => {
                    this.handleStreamEvent(event);
                },
                // onError
                (error) => {
                    console.error('Chat error:', error);
                    this.isStreaming = false;
                    this.updateStreamingState(false);
                    UI.showNotification('Failed to send message', 'error');
                },
                // onComplete
                () => {
                    this.isStreaming = false;
                    this.updateStreamingState(false);
                    
                    // Save final message to storage
                    if (this.currentStreamingMessage) {
                        Storage.addMessageToCache(this.currentSession.id, {
                            role: 'assistant',
                            content: this.currentStreamingMessage.content
                        });
                    }
                    
                    // Reset streaming state
                    this.currentStreamingMessage = null;
                    this.currentContent = '';
                }
            );
        } catch (error) {
            console.error('Send message error:', error);
            this.isStreaming = false;
            this.updateStreamingState(false);
            UI.showNotification('Failed to send message', 'error');
        }
    }
    
    /**
     * Handle stream event
     */
    handleStreamEvent(event) {
        switch (event.event) {
            case 'response.output_text.delta':
                if (event.data?.delta) {
                    this.currentContent += event.data.delta;
                    
                    // Find existing assistant message or create new one
                    if (this.currentStreamingMessage) {
                        this.currentStreamingMessage.content = this.currentContent;
                        this.updateStreamingMessage(this.currentStreamingMessage);
                    } else {
                        // Create new assistant message
                        this.currentStreamingMessage = {
                            id: event.data.item_id || Utils.generateId(),
                            role: 'assistant',
                            content: this.currentContent,
                            timestamp: new Date().toISOString()
                        };
                        this.addMessage(this.currentStreamingMessage);
                    }
                }
                break;
                
            case 'response.output_item.done':
                if (event.data?.item?.type === 'message') {
                    const content = event.data.item.content?.[0]?.text || '';
                    if (content && this.currentStreamingMessage) {
                        this.currentStreamingMessage.content = content;
                        this.updateStreamingMessage(this.currentStreamingMessage);
                    }
                }
                break;
                
            case 'response.function_call_arguments.delta':
                // Handle tool calls
                this.handleToolCall(event);
                break;
                
            case 'error':
                console.error('Stream error:', event.data);
                UI.showNotification('An error occurred', 'error');
                break;
        }
    }
    
    /**
     * Add message to chat
     */
    addMessage(message) {
        this.messages.push(message);
        UI.renderMessage(message);
        
        // Auto scroll
        const settings = Storage.getSettings();
        if (settings.autoScroll) {
            UI.scrollToBottom();
        }
        
        // Save to storage
        Storage.addMessageToCache(this.currentSession.id, message);
    }
    
    /**
     * Update streaming message
     */
    updateStreamingMessage(message) {
        const element = document.querySelector(`[data-message-id="${message.id}"]`);
        if (element) {
            const content = element.querySelector('.message-text');
            if (content) {
                const settings = Storage.getSettings();
                if (settings.enableMarkdown) {
                    content.innerHTML = Utils.parseMarkdown(message.content);
                } else {
                    content.textContent = message.content;
                }
                
                // Highlight code blocks
                if (settings.enableHighlighting) {
                    content.querySelectorAll('pre code').forEach(block => {
                        Prism.highlightElement(block);
                    });
                }
            }
        } else {
            this.addMessage(message);
        }
    }
    
    /**
     * Handle tool call
     */
    handleToolCall(event) {
        // Create tool call display
        const toolCall = {
            id: event.data?.item_id || Utils.generateId(),
            type: 'tool_call',
            name: event.data?.name || 'Function',
            arguments: event.data?.arguments || '',
            status: event.data?.status || 'in_progress'
        };
        
        UI.renderToolCall(toolCall);
    }
    
    /**
     * Load session
     */
    async loadSession(sessionId) {
        try {
            UI.showLoading(true);
            
            const sessionData = await API.getSession(sessionId);
            
            this.currentSession = sessionData.session;
            this.messages = sessionData.messages || [];
            
            // Update UI
            UI.clearMessages();
            this.messages.forEach(message => {
                UI.renderMessage(message);
            });
            
            UI.showLoading(false);
        } catch (error) {
            console.error('Load session error:', error);
            UI.showLoading(false);
            UI.showNotification('Failed to load session', 'error');
        }
    }
    
    /**
     * Create new session
     */
    async createSession(chatbotId) {
        try {
            const session = await API.createSession(chatbotId);
            this.currentSession = session;
            Storage.setCurrentSession(session);
            
            // Clear messages
            this.messages = [];
            UI.clearMessages();
            
            // Welcome messages removed per user request
            
            return session;
        } catch (error) {
            console.error('Create session error:', error);
            UI.showNotification('Failed to create session', 'error');
            return null;
        }
    }
    
    /**
     * Select chatbot
     */
    async selectChatbot(chatbot) {
        this.currentChatbot = chatbot;
        Storage.setCurrentChatbot(chatbot);
        
        // Create new session
        const session = await this.createSession(chatbot.id);
        
        // Update UI
        UI.updateChatbotInfo(chatbot);
        UI.showSuggestedPrompts(chatbot.suggested_prompts || []);
        
        return session;
    }
    
    /**
     * Clear chat
     */
    clearChat() {
        if (confirm('このチャットをクリアしてもよろしいですか？')) {
            this.messages = [];
            UI.clearMessages();
            
            // Welcome messages removed per user request
        }
    }
    
    /**
     * Export chat
     */
    async exportChat() {
        if (!this.currentSession) {
            UI.showNotification('No active session', 'warning');
            return;
        }
        
        try {
            const format = confirm('Markdown形式でエクスポートしますか？（キャンセルでJSON形式）') ? 'markdown' : 'json';
            const exportData = await API.exportSession(this.currentSession.id, format);
            
            const filename = `chat_${this.currentSession.id}_${new Date().toISOString().slice(0, 10)}.${format === 'markdown' ? 'md' : 'json'}`;
            const content = format === 'markdown' ? exportData.content : JSON.stringify(exportData, null, 2);
            
            Utils.downloadFile(content, filename, format === 'markdown' ? 'text/markdown' : 'application/json');
            
            UI.showNotification('Chat exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            UI.showNotification('Failed to export chat', 'error');
        }
    }
    
    /**
     * Update streaming state
     */
    updateStreamingState(isStreaming) {
        const sendButton = document.getElementById('send-button');
        const loadingMessage = document.getElementById('loading-message');
        
        sendButton.disabled = isStreaming;
        
        if (isStreaming) {
            loadingMessage.classList.remove('hidden');
        } else {
            loadingMessage.classList.add('hidden');
        }
    }
}

// Create global chat instance
const Chat = new ChatManager();