/**
 * NextJS-style Chat Manager
 */

class NextJSChatManager {
    constructor() {
        this.currentSession = null;
        this.currentChatbot = null;
        this.messages = [];
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.assistantMessageContent = '';
    }
    
    /**
     * Initialize chat
     */
    async init() {
        // Setup is handled by UI
    }
    
    /**
     * Send message (NextJS style)
     */
    async sendMessage(message) {
        if (!message.trim() || this.isStreaming) return;
        
        if (!this.currentChatbot) {
            UI.showNotification('最初にチャットボットを選択してください', 'warning');
            return;
        }
        
        // Create session on first message if it doesn't exist
        if (!this.currentSession) {
            const session = await this.createSession(this.currentChatbot.id);
            if (!session) {
                UI.showNotification('セッションの作成に失敗しました', 'error');
                return;
            }
        }
        
        // Add user message (like NextJS)
        const userItem = {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: message.trim() }],
            id: this.generateId(),
            timestamp: new Date().toISOString()
        };
        
        this.addMessage(userItem);
        Storage.addMessageToCache(this.currentSession.id, userItem);
        console.log('💾 Saved user message to cache');
        
        try {
            this.isStreaming = true;
            UI.showLoading(true);
            
            // Variables to track streaming state (like NextJS)
            const streamState = { assistantMessageContent: "" };
            
            await API.streamChat(
                this.currentSession.id,
                message,
                // onMessage callback (like NextJS handleTurn)
                async (event) => {
                    await this.processStreamEvent(event, streamState);
                },
                // onError
                (error) => {
                    console.error('Chat error:', error);
                    this.isStreaming = false;
                    UI.showLoading(false);
                    UI.showNotification('メッセージの送信に失敗しました', 'error');
                },
                // onComplete
                () => {
                    this.isStreaming = false;
                    UI.showLoading(false);
                }
            );
        } catch (error) {
            console.error('Send message error:', error);
            this.isStreaming = false;
            UI.showLoading(false);
            UI.showNotification('メッセージの送信に失敗しました', 'error');
        }
    }
    
    /**
     * Process stream event (exactly like NextJS processMessages)
     */
    async processStreamEvent(event, streamState) {
        console.log('🎯 Processing stream event:', event);
        
        switch (event.event) {
            case "response.output_text.delta":
            case "response.output_text.annotation.added": {
                const { delta, item_id, annotation } = event.data || {};
                
                let partial = "";
                if (typeof delta === "string") {
                    partial = delta;
                }
                streamState.assistantMessageContent += partial;
                
                // If the last message isn't an assistant message, create a new one
                const lastItem = this.messages[this.messages.length - 1];
                if (
                    !lastItem ||
                    lastItem.type !== "message" ||
                    lastItem.role !== "assistant" ||
                    (lastItem.id && lastItem.id !== item_id)
                ) {
                    const newMessage = {
                        type: "message",
                        role: "assistant",
                        id: item_id,
                        content: [
                            {
                                type: "output_text",
                                text: streamState.assistantMessageContent,
                            },
                        ],
                        timestamp: new Date().toISOString()
                    };
                    
                    this.messages.push(newMessage);
                    UI.renderMessage(newMessage);
                    UI.showLoading(false); // Hide loading when first content arrives
                } else {
                    const contentItem = lastItem.content[0];
                    if (contentItem && contentItem.type === "output_text") {
                        contentItem.text = streamState.assistantMessageContent;
                        if (annotation) {
                            contentItem.annotations = [
                                ...(contentItem.annotations ?? []),
                                annotation,
                            ];
                        }
                    }
                    UI.updateStreamingMessage(lastItem);
                }
                break;
            }
            
            case "response.output_item.done": {
                const { item } = event.data || {};
                if (item && item.type === "message" && item.role === "assistant") {
                    // Save completed assistant message
                    const assistantMessage = {
                        type: "message",
                        role: "assistant",
                        content: item.content || [{ type: "output_text", text: streamState.assistantMessageContent }],
                        id: item.id,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Save to storage
                    Storage.addMessageToCache(this.currentSession.id, assistantMessage);
                    console.log('💾 Saved completed assistant message to cache');
                }
                break;
            }
            
            case "response.completed": {
                console.log("Response completed", event.data);
                break;
            }
            
            case "error": {
                console.error('Stream error:', event.data);
                UI.showNotification('エラーが発生しました', 'error');
                break;
            }
        }
    }
    
    /**
     * Add message to chat
     */
    addMessage(message) {
        this.messages.push(message);
        UI.renderMessage(message);
    }
    
    /**
     * Select chatbot and create session
     */
    async selectChatbot(chatbot) {
        this.currentChatbot = chatbot;
        Storage.setCurrentChatbot(chatbot);
        
        // Clear current session - will be created on first message
        this.currentSession = null;
        this.messages = [];
        Storage.setCurrentSession(null);
        
        return chatbot;
    }
    
    /**
     * Create new session
     */
    async createSession(chatbotId) {
        try {
            const session = await API.createSession(chatbotId);
            this.currentSession = session;
            Storage.setCurrentSession(session);
            
            // Add session to cache
            let cachedSessions = Storage.getCachedSessions();
            const existingIndex = cachedSessions.findIndex(s => s.id === session.id);
            if (existingIndex === -1) {
                cachedSessions.unshift(session); // Add to beginning
                if (cachedSessions.length > 20) {
                    cachedSessions = cachedSessions.slice(0, 20); // Keep only last 20
                }
                Storage.cacheSessions(cachedSessions);
            }
            
            // Clear messages
            this.messages = [];
            UI.clearMessages();
            
            // Load cached messages if they exist
            const cachedMessages = Storage.getCachedMessages(session.id);
            if (cachedMessages.length > 0) {
                console.log(`📂 Loading ${cachedMessages.length} cached messages`);
                cachedMessages.forEach(msg => {
                    this.messages.push(msg);
                    UI.renderMessage(msg);
                });
            }
            
            return session;
        } catch (error) {
            console.error('Create session error:', error);
            UI.showNotification('セッションの作成に失敗しました', 'error');
            return null;
        }
    }
    
    /**
     * Clear chat
     */
    clearChat() {
        if (this.currentSession) {
            // Clear cached messages
            Storage.clearCachedMessages(this.currentSession.id);
            console.log('🗑️ Cleared cached messages');
        }
        
        this.messages = [];
        UI.clearMessages();
        
        // Welcome messages removed per user request
    }
    
    /**
     * Export chat
     */
    async exportChat() {
        if (!this.currentSession) {
            UI.showNotification('アクティブなセッションがありません', 'warning');
            return;
        }
        
        try {
            const format = confirm('Markdown形式でエクスポートしますか？（キャンセルでJSON形式）') ? 'markdown' : 'json';
            const exportData = await API.exportSession(this.currentSession.id, format);
            
            const filename = `chat_${this.currentSession.id}_${new Date().toISOString().slice(0, 10)}.${format === 'markdown' ? 'md' : 'json'}`;
            const content = format === 'markdown' ? exportData.content : JSON.stringify(exportData, null, 2);
            
            this.downloadFile(content, filename, format === 'markdown' ? 'text/markdown' : 'application/json');
            
            UI.showNotification('チャットのエクスポートが完了しました', 'success');
        } catch (error) {
            console.error('Export error:', error);
            UI.showNotification('チャットのエクスポートに失敗しました', 'error');
        }
    }
    
    /**
     * Download file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Create global chat instance
const Chat = new NextJSChatManager();