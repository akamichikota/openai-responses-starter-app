/**
 * NextJS-style UI Manager
 */

class NextJSUI {
    constructor() {
        this.isComposing = false;
        this.currentSession = null;
    }
    
    /**
     * Initialize UI
     */
    async init() {
        this.setupEventListeners();
        await this.loadChatbots();
        
        // Restore previous state if exists
        await this.restorePreviousState();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Message input events
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        
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
        
        
        // Clear chat button (Delete current session)
        document.getElementById('clear-chat-btn').addEventListener('click', () => {
            this.deleteCurrentSession();
        });
        
        // Export chat button
        document.getElementById('export-chat-btn').addEventListener('click', () => {
            Chat.exportChat();
        });
        
        // Bulk delete button
        document.getElementById('bulk-delete-btn').addEventListener('click', () => {
            this.bulkDeleteSessions();
        });
    }
    
    /**
     * Handle input change
     */
    handleInputChange(event) {
        const input = event.target;
        const sendButton = document.getElementById('send-button');
        
        // Auto resize textarea
        this.autoResizeTextarea(input);
        
        // Enable/disable send button
        sendButton.disabled = !input.value.trim() || Chat.isStreaming;
    }
    
    /**
     * Auto resize textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    /**
     * Send message
     */
    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || Chat.isStreaming) return;
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        this.handleInputChange({ target: input });
        
        // Send via chat manager
        await Chat.sendMessage(message);
    }
    
    /**
     * Load chatbots
     */
    async loadChatbots() {
        try {
            const chatbots = await API.getChatbots();
            
            // Cache chatbots globally for getChatbot lookup
            window.cachedChatbots = chatbots;
            
            this.renderChatbots(chatbots);
        } catch (error) {
            console.error('Failed to load chatbots:', error);
        }
    }
    
    /**
     * Render chatbots list
     */
    renderChatbots(chatbots) {
        const container = document.getElementById('chatbot-list');
        container.innerHTML = '';
        
        chatbots.forEach(chatbot => {
            const item = document.createElement('div');
            item.className = 'p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors';
            item.innerHTML = `
                <h3 class="font-medium text-gray-900 text-sm">${chatbot.name}</h3>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">${chatbot.description}</p>
            `;
            
            item.addEventListener('click', () => {
                this.selectChatbot(chatbot);
            });
            
            container.appendChild(item);
        });
    }
    
    /**
     * Select chatbot
     */
    async selectChatbot(chatbot) {
        // Update UI to show chat interface
        this.showChatInterface();
        
        // Update header
        document.getElementById('current-chatbot-name').textContent = chatbot.name;
        document.getElementById('current-chatbot-desc').textContent = chatbot.description;
        
        // Initialize chat with selected chatbot (session created on first message)
        await Chat.selectChatbot(chatbot);
    }
    
    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('chat-messages').classList.add('hidden');
        document.getElementById('message-input-area').classList.add('hidden');
        document.getElementById('chat-header').classList.add('hidden');
        
        // Clear current session
        Chat.currentSession = null;
        Chat.currentChatbot = null;
        Chat.messages = [];
    }
    
    /**
     * Show chat interface
     */
    showChatInterface() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('chat-messages').classList.remove('hidden');
        document.getElementById('message-input-area').classList.remove('hidden');
        document.getElementById('chat-header').classList.remove('hidden');
        
        // Clear messages
        this.clearMessages();
    }
    
    /**
     * Render message in NextJS style
     */
    renderMessage(message) {
        const container = document.getElementById('messages-container');
        const messageEl = document.createElement('div');
        messageEl.className = 'text-sm message-enter';
        messageEl.setAttribute('data-message-id', message.id);
        
        // Extract content text based on NextJS format
        let contentText = '';
        if (typeof message.content === 'string') {
            contentText = message.content;
        } else if (Array.isArray(message.content) && message.content[0]) {
            contentText = message.content[0].text || message.content[0].content || '';
        }
        
        if (message.role === 'user') {
            // User message (right-aligned, gray background)
            messageEl.innerHTML = `
                <div class="flex justify-end">
                    <div>
                        <div class="ml-4 rounded-[16px] px-4 py-2 md:ml-24 bg-[#ededed] text-stone-900 font-light">
                            <div class="markdown-content">
                                ${this.formatContent(contentText)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Assistant message (left-aligned, white background)
            messageEl.innerHTML = `
                <div class="flex flex-col">
                    <div class="flex">
                        <div class="mr-4 rounded-[16px] px-4 py-2 md:mr-24 text-black bg-white font-light">
                            <div class="markdown-content">
                                ${this.formatContent(contentText)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    /**
     * Update streaming message
     */
    updateStreamingMessage(message) {
        const element = document.querySelector(`[data-message-id="${message.id}"]`);
        if (element) {
            const contentDiv = element.querySelector('.markdown-content');
            if (contentDiv) {
                // Extract content text based on NextJS format
                let contentText = '';
                if (typeof message.content === 'string') {
                    contentText = message.content;
                } else if (Array.isArray(message.content) && message.content[0]) {
                    contentText = message.content[0].text || message.content[0].content || '';
                }
                
                contentDiv.innerHTML = this.formatContent(contentText);
            }
        } else {
            this.renderMessage(message);
        }
        this.scrollToBottom();
    }
    
    /**
     * Format message content with full markdown support
     */
    formatContent(content) {
        if (!content) return '';
        
        // Trim trailing whitespace and newlines first
        content = content.trim();
        
        try {
            // Use marked.js for full markdown support if available
            if (typeof marked !== 'undefined') {
                // Configure marked for better code display
                marked.setOptions({
                    highlight: function(code, lang) {
                        // Basic syntax highlighting placeholder
                        return `<code class="language-${lang || 'text'}">${Utils.escapeHtml(code)}</code>`;
                    },
                    breaks: true,
                    gfm: true
                });
                
                return marked.parse(content);
            }
        } catch (error) {
            console.warn('Marked.js error, falling back to simple formatting:', error);
        }
        
        // Fallback: Enhanced simple markdown-like formatting
        let formatted = content
            // Trim trailing whitespace and newlines
            .trim()
            // Code blocks with language support
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            // Strikethrough
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Bold and Italic combined (must be first)
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
            // Bold (both ** and __) - process before single * and _
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            // Italic (single * and _) - use word boundary to avoid conflict
            .replace(/\b\*([^*\s][^*]*[^*\s])\*\b/g, '<em>$1</em>')
            .replace(/\b_([^_\s][^_]*[^_\s])_\b/g, '<em>$1</em>')
            // Handle single character italic
            .replace(/\*([^*\s])\*/g, '<em>$1</em>')
            .replace(/_([^_\s])_/g, '<em>$1</em>')
            // Headers (h1-h6)
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Images
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded">')
            // Blockquotes
            .replace(/^> (.+)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gm, '<hr class="my-4 border-gray-300">')
            .replace(/^\*\*\*$/gm, '<hr class="my-4 border-gray-300">')
            // Ordered lists (numbered)
            .replace(/^(\d+)\. (.+)/gm, '<li class="ordered-list">$2</li>')
            // Unordered lists
            .replace(/^\* (.+)/gm, '<li class="unordered-list">$1</li>')
            .replace(/^- (.+)/gm, '<li class="unordered-list">$1</li>')
            .replace(/^\+ (.+)/gm, '<li class="unordered-list">$1</li>')
            // Line breaks
            .replace(/\n/g, '<br>');
        
        // Wrap consecutive ordered list items in ol tags
        formatted = formatted.replace(/(<li class="ordered-list">[^<]*<\/li>(?:<br>)*)+/g, function(match) {
            const cleanMatch = match.replace(/<br>/g, '').replace(/class="ordered-list"/g, '');
            return `<ol>${cleanMatch}</ol>`;
        });
        
        // Wrap consecutive unordered list items in ul tags
        formatted = formatted.replace(/(<li class="unordered-list">[^<]*<\/li>(?:<br>)*)+/g, function(match) {
            const cleanMatch = match.replace(/<br>/g, '').replace(/class="unordered-list"/g, '');
            return `<ul>${cleanMatch}</ul>`;
        });
        
        return formatted;
    }
    
    
    /**
     * Show loading indicator
     */
    showLoading(show = true) {
        const loading = document.getElementById('loading-message');
        if (show) {
            loading.classList.remove('hidden');
            this.scrollToBottom();
        } else {
            loading.classList.add('hidden');
        }
    }
    
    /**
     * Clear all messages
     */
    clearMessages() {
        const container = document.getElementById('messages-container');
        container.innerHTML = '';
    }
    
    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        const scrollAnchor = document.getElementById('scroll-anchor');
        if (scrollAnchor) {
            scrollAnchor.scrollIntoView({ behavior: 'instant' });
        }
    }
    
    /**
     * Restore previous state from storage
     */
    async restorePreviousState() {
        const currentSession = Storage.getCurrentSession();
        const currentChatbot = Storage.getCurrentChatbot();
        
        if (currentSession && currentChatbot) {
            // Set current state in Chat manager
            Chat.currentSession = currentSession;
            Chat.currentChatbot = currentChatbot;
            
            // Show chat interface
            this.showChatInterface();
            
            // Update header
            document.getElementById('current-chatbot-name').textContent = currentChatbot.name;
            document.getElementById('current-chatbot-desc').textContent = currentChatbot.description;
            
            // Load cached messages
            const cachedMessages = Storage.getCachedMessages(currentSession.id);
            
            if (cachedMessages.length > 0) {
                Chat.messages = [];
                this.clearMessages();
                
                cachedMessages.forEach(msg => {
                    Chat.messages.push(msg);
                    this.renderMessage(msg);
                });
                
            }
        } else {
        }
        
        // Load recent sessions for sidebar
        await this.loadRecentSessions();
    }
    
    /**
     * Load recent sessions
     */
    async loadRecentSessions() {
        try {
            const sessions = await API.getSessions(10, 0); // Get last 10 sessions
            this.renderRecentSessions(sessions);
        } catch (error) {
            console.error('Could not load recent sessions:', error);
            // Try to load from cache
            const cachedSessions = Storage.getCachedSessions();
            if (cachedSessions.length > 0) {
                this.renderRecentSessions(cachedSessions.slice(0, 10));
            }
        }
    }
    
    /**
     * Render recent sessions
     */
    renderRecentSessions(sessions) {
        const container = document.getElementById('session-list');
        container.innerHTML = '';
        
        if (sessions.length === 0) {
            container.innerHTML = '<div class="text-sm text-gray-500 px-3 py-2">最近のチャットがありません</div>';
            return;
        }
        
        sessions.forEach(session => {
            const item = document.createElement('div');
            item.className = 'group p-2 rounded-lg hover:bg-gray-100 text-sm transition-colors relative';
            
            // Format date
            const date = new Date(session.created_at || session.last_activity);
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            item.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1 cursor-pointer session-content" data-session-id="${session.id}">
                        <div class="font-medium text-gray-900 truncate">${session.name || 'タイトルなしチャット'}</div>
                        <div class="text-xs text-gray-500 mt-1">${formattedDate} • ${session.message_count || 0}件のメッセージ</div>
                    </div>
                    <button class="delete-session opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all ml-2" 
                            data-session-id="${session.id}" 
                            title="チャットを削除">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Add click handler for session loading
            item.querySelector('.session-content').addEventListener('click', async () => {
                await this.loadSession(session);
            });
            
            // Add click handler for delete button
            item.querySelector('.delete-session').addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.deleteSession(session);
            });
            
            container.appendChild(item);
        });
    }
    
    /**
     * Load a specific session
     */
    async loadSession(session) {
        try {
            // Get full session data from API
            const sessionData = await API.getSession(session.id);
            
            // Find the chatbot for this session
            const chatbot = await API.getChatbot(sessionData.session.chatbot_id);
            
            // Update state
            Chat.currentSession = sessionData.session;
            Chat.currentChatbot = chatbot;
            Storage.setCurrentSession(sessionData.session);
            Storage.setCurrentChatbot(chatbot);
            
            // Show chat interface
            this.showChatInterface();
            
            // Update header
            document.getElementById('current-chatbot-name').textContent = chatbot.name;
            document.getElementById('current-chatbot-desc').textContent = chatbot.description;
            
            // Clear and load messages
            Chat.messages = [];
            this.clearMessages();
            
            if (sessionData.messages && sessionData.messages.length > 0) {
                sessionData.messages.forEach(msg => {
                    // Convert to our format
                    const message = {
                        id: msg.id,
                        type: 'message',
                        role: msg.role,
                        content: Array.isArray(msg.content) ? msg.content : [{ type: 'output_text', text: msg.raw_content || msg.content }],
                        timestamp: msg.created_at
                    };
                    
                    Chat.messages.push(message);
                    this.renderMessage(message);
                });
            }
            
        } catch (error) {
            console.error('Failed to load session:', error);
            this.showNotification('チャットセッションの読み込みに失敗しました', 'error');
        }
    }
    
    /**
     * Delete a session
     */
    async deleteSession(session) {
        const confirmed = confirm(`チャット「${session.name || 'タイトルなしチャット'}」を削除しますか？この操作は元に戻せません。`);
        if (!confirmed) return;
        
        try {
            // Delete from server
            await API.deleteSession(session.id);
            
            // Delete from local storage
            Storage.clearCachedMessages(session.id);
            
            // Remove from cached sessions
            let cachedSessions = Storage.getCachedSessions();
            cachedSessions = cachedSessions.filter(s => s.id !== session.id);
            Storage.cacheSessions(cachedSessions);
            
            // If this is the current session, go back to welcome screen
            if (Chat.currentSession && Chat.currentSession.id === session.id) {
                Chat.currentSession = null;
                Chat.currentChatbot = null;
                Chat.messages = [];
                Storage.setCurrentSession(null);
                Storage.setCurrentChatbot(null);
                this.showWelcomeScreen();
            }
            
            // Refresh the recent sessions list
            await this.loadRecentSessions();
            
            
        } catch (error) {
            console.error('Failed to delete session:', error);
            this.showNotification('チャットセッションの削除に失敗しました', 'error');
        }
    }
    
    /**
     * Bulk delete all sessions
     */
    async bulkDeleteSessions() {
        const confirmed = confirm('全てのチャット履歴を削除しますか？この操作は元に戻せず、全ての会話が削除されます。');
        if (!confirmed) return;
        
        try {
            // Delete from server
            await API.bulkDeleteSessions();
            
            // Clear all local storage
            Storage.cacheSessions([]);
            
            // Clear all session messages from localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('session_messages_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // If currently in a chat session, go back to welcome screen
            if (Chat.currentSession) {
                Chat.currentSession = null;
                Chat.currentChatbot = null;
                Chat.messages = [];
                Storage.setCurrentSession(null);
                Storage.setCurrentChatbot(null);
                this.showWelcomeScreen();
            }
            
            // Refresh the recent sessions list
            await this.loadRecentSessions();
            
            
        } catch (error) {
            console.error('Failed to bulk delete sessions:', error);
            this.showNotification('チャット履歴の削除に失敗しました', 'error');
        }
    }
    
    /**
     * Delete the current session
     */
    async deleteCurrentSession() {
        if (!Chat.currentSession) {
            this.showNotification('削除するセッションがありません', 'warning');
            return;
        }
        
        const confirmed = confirm(`現在のチャット「${Chat.currentSession.name || 'タイトルなしチャット'}」を削除しますか？この操作は元に戻せません。`);
        if (!confirmed) return;
        
        try {
            // Delete from server
            await API.deleteSession(Chat.currentSession.id);
            
            // Delete from local storage
            Storage.clearCachedMessages(Chat.currentSession.id);
            
            // Remove from cached sessions
            let cachedSessions = Storage.getCachedSessions();
            cachedSessions = cachedSessions.filter(s => s.id !== Chat.currentSession.id);
            Storage.cacheSessions(cachedSessions);
            
            // Clear current state
            Chat.currentSession = null;
            Chat.currentChatbot = null;
            Chat.messages = [];
            Storage.setCurrentSession(null);
            Storage.setCurrentChatbot(null);
            
            // Go back to welcome screen
            this.showWelcomeScreen();
            
            // Refresh the recent sessions list
            await this.loadRecentSessions();
            
            
        } catch (error) {
            console.error('Failed to delete current session:', error);
            this.showNotification('チャットの削除に失敗しました', 'error');
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple alert for now - could be improved with toast notifications
        if (type === 'error') {
            alert('エラー: ' + message);
        } else if (type === 'warning') {
            alert('警告: ' + message);
        } else if (type === 'success') {
            alert('成功: ' + message);
        }
    }
}

// Create global UI instance
const UI = new NextJSUI();