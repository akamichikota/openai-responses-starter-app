/**
 * UI management
 */

const UI = {
    /**
     * Initialize UI
     */
    init() {
        this.setupTheme();
        this.setupMobileMenu();
        this.setupScrollHandler();
        this.setupSettings();
        this.applySettings();
    },
    
    /**
     * Setup theme
     */
    setupTheme() {
        const theme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => {
            const currentTheme = Storage.getTheme();
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            Storage.setTheme(newTheme);
            
            // Update icon
            const icon = themeToggle.querySelector('i');
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    },
    
    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebar-toggle');
        
        menuToggle?.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
        
        sidebarClose?.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    },
    
    /**
     * Setup scroll handler
     */
    setupScrollHandler() {
        const messagesContainer = document.getElementById('messages-container');
        const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
        
        messagesContainer?.addEventListener('scroll', () => {
            const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < APP_CONFIG.AUTO_SCROLL_THRESHOLD;
            
            if (isAtBottom) {
                scrollToBottomBtn?.classList.add('hidden');
            } else {
                scrollToBottomBtn?.classList.remove('hidden');
            }
        });
        
        scrollToBottomBtn?.addEventListener('click', () => {
            this.scrollToBottom();
        });
    },
    
    /**
     * Setup settings
     */
    setupSettings() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const modalClose = settingsModal?.querySelector('.modal-close');
        
        settingsBtn?.addEventListener('click', () => {
            settingsModal?.classList.remove('hidden');
        });
        
        modalClose?.addEventListener('click', () => {
            settingsModal?.classList.add('hidden');
        });
        
        // Settings controls
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const fontSizeSelect = document.getElementById('font-size-select');
        const enableMarkdown = document.getElementById('enable-markdown');
        const enableHighlighting = document.getElementById('enable-highlighting');
        const autoScroll = document.getElementById('auto-scroll');
        const virtualScrolling = document.getElementById('virtual-scrolling');
        const progressiveLoading = document.getElementById('progressive-loading');
        
        const settings = Storage.getSettings();
        
        // Apply current settings to controls
        if (darkModeToggle) darkModeToggle.checked = Storage.getTheme() === 'dark';
        if (fontSizeSelect) fontSizeSelect.value = settings.fontSize;
        if (enableMarkdown) enableMarkdown.checked = settings.enableMarkdown;
        if (enableHighlighting) enableHighlighting.checked = settings.enableHighlighting;
        if (autoScroll) autoScroll.checked = settings.autoScroll;
        if (virtualScrolling) virtualScrolling.checked = settings.virtualScrolling;
        if (progressiveLoading) progressiveLoading.checked = settings.progressiveLoading;
        
        // Add event listeners
        darkModeToggle?.addEventListener('change', (e) => {
            Storage.setTheme(e.target.checked ? 'dark' : 'light');
        });
        
        fontSizeSelect?.addEventListener('change', (e) => {
            Storage.updateSettings({ fontSize: e.target.value });
            this.applySettings();
        });
        
        enableMarkdown?.addEventListener('change', (e) => {
            Storage.updateSettings({ enableMarkdown: e.target.checked });
        });
        
        enableHighlighting?.addEventListener('change', (e) => {
            Storage.updateSettings({ enableHighlighting: e.target.checked });
        });
        
        autoScroll?.addEventListener('change', (e) => {
            Storage.updateSettings({ autoScroll: e.target.checked });
        });
        
        virtualScrolling?.addEventListener('change', (e) => {
            Storage.updateSettings({ virtualScrolling: e.target.checked });
        });
        
        progressiveLoading?.addEventListener('change', (e) => {
            Storage.updateSettings({ progressiveLoading: e.target.checked });
        });
    },
    
    /**
     * Apply settings
     */
    applySettings() {
        const settings = Storage.getSettings();
        
        // Apply font size
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[settings.fontSize] || '16px';
    },
    
    /**
     * Render message
     */
    renderMessage(message) {
        const messagesList = document.getElementById('messages-list');
        const settings = Storage.getSettings();
        
        // Remove welcome message if exists
        const welcomeMessage = messagesList.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageElement = Utils.createElement('div', ['message', `message-${message.role}`], {
            'data-message-id': message.id
        });
        
        const messageContent = Utils.createElement('div', ['message-content']);
        const messageText = Utils.createElement('div', ['message-text']);
        
        // Parse content
        let content = message.content;
        if (typeof content === 'object' && content.length > 0) {
            content = content[0].text || content[0].content || '';
        }
        
        if (settings.enableMarkdown && message.role !== 'user') {
            messageText.innerHTML = Utils.parseMarkdown(content);
        } else {
            messageText.textContent = content;
        }
        
        messageContent.appendChild(messageText);
        messageElement.appendChild(messageContent);
        
        // Add progressive loading animation
        if (settings.progressiveLoading) {
            messageElement.classList.add('progressive-enter');
            setTimeout(() => {
                messageElement.classList.add('progressive-enter-active');
            }, 10);
        }
        
        messagesList.appendChild(messageElement);
        
        // Highlight code blocks
        if (settings.enableHighlighting) {
            messageText.querySelectorAll('pre code').forEach(block => {
                Prism.highlightElement(block);
            });
        }
        
        // Add copy buttons to code blocks
        messageText.querySelectorAll('pre').forEach(pre => {
            const copyBtn = Utils.createElement('button', ['code-copy-btn']);
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyBtn.addEventListener('click', async () => {
                const code = pre.textContent;
                const success = await Utils.copyToClipboard(code);
                if (success) {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
            });
            
            const codeHeader = Utils.createElement('div', ['code-header']);
            codeHeader.appendChild(copyBtn);
            pre.insertBefore(codeHeader, pre.firstChild);
        });
    },
    
    /**
     * Render tool call
     */
    renderToolCall(toolCall) {
        const messagesList = document.getElementById('messages-list');
        
        const toolElement = Utils.createElement('div', ['tool-call', 'tool-call-enter'], {
            'data-tool-id': toolCall.id
        });
        
        const header = Utils.createElement('div', ['tool-call-header']);
        header.innerHTML = `
            <i class="fas fa-cog"></i>
            <span>${toolCall.status === 'completed' ? 'Executed' : 'Executing'}: ${toolCall.name}</span>
        `;
        
        const content = Utils.createElement('div', ['tool-call-content']);
        content.textContent = toolCall.arguments || 'Processing...';
        
        toolElement.appendChild(header);
        toolElement.appendChild(content);
        
        messagesList.appendChild(toolElement);
    },
    
    /**
     * Render chatbot item
     */
    renderChatbot(chatbot, container) {
        const item = Utils.createElement('div', ['chatbot-item'], {
            'data-chatbot-id': chatbot.id
        });
        
        item.innerHTML = `
            <div class="chatbot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="chatbot-info">
                <div class="chatbot-name">${chatbot.name}</div>
                <div class="chatbot-category">${chatbot.category}</div>
            </div>
            ${chatbot.is_featured ? '<span class="badge badge-featured">Featured</span>' : ''}
        `;
        
        item.addEventListener('click', () => {
            this.selectChatbot(chatbot);
        });
        
        container.appendChild(item);
    },
    
    /**
     * Render session item
     */
    renderSession(session, container) {
        const item = Utils.createElement('div', ['session-item'], {
            'data-session-id': session.id
        });
        
        item.innerHTML = `
            <div class="session-name">${session.name || 'Untitled Chat'}</div>
            <div class="session-meta">
                ${session.message_count} messages • ${Utils.formatDate(session.last_activity)}
            </div>
        `;
        
        item.addEventListener('click', () => {
            this.selectSession(session);
        });
        
        container.appendChild(item);
    },
    
    /**
     * Select chatbot
     */
    async selectChatbot(chatbot) {
        // Update UI
        document.querySelectorAll('.chatbot-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-chatbot-id="${chatbot.id}"]`);
        selectedItem?.classList.add('active');
        
        // Select in chat manager
        await Chat.selectChatbot(chatbot);
        
        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('open');
    },
    
    /**
     * Select session
     */
    async selectSession(session) {
        // Update UI
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-session-id="${session.id}"]`);
        selectedItem?.classList.add('active');
        
        // Load session
        await Chat.loadSession(session.id);
        
        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('open');
    },
    
    /**
     * Update chatbot info
     */
    updateChatbotInfo(chatbot) {
        const nameElement = document.getElementById('current-chatbot-name');
        const descElement = document.getElementById('current-chatbot-desc');
        const avatarIcon = document.getElementById('chatbot-avatar-icon');
        
        if (nameElement) nameElement.textContent = chatbot.name;
        if (descElement) descElement.textContent = chatbot.description;
        
        // Update theme color
        document.documentElement.style.setProperty('--primary-color', chatbot.theme_color || '#667eea');
    },
    
    /**
     * Show suggested prompts
     */
    showSuggestedPrompts(prompts) {
        const container = document.getElementById('suggested-prompts');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (prompts.length === 0) {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        
        prompts.forEach(prompt => {
            const chip = Utils.createElement('button', ['prompt-chip']);
            chip.textContent = prompt;
            chip.addEventListener('click', () => {
                const input = document.getElementById('message-input');
                input.value = prompt;
                input.dispatchEvent(new Event('input'));
                input.focus();
            });
            container.appendChild(chip);
        });
    },
    
    /**
     * Clear messages
     */
    clearMessages() {
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';
    },
    
    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    },
    
    /**
     * Show loading
     */
    showLoading(show) {
        const loadingScreen = document.getElementById('loading-screen');
        if (show) {
            loadingScreen?.classList.remove('hidden');
        } else {
            loadingScreen?.classList.add('hidden');
        }
    },
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = Utils.createElement('div', ['notification', `notification-${type}`]);
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Add enter animation
        setTimeout(() => {
            notification.classList.add('notification-enter');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};