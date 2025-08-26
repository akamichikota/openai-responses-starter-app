/**
 * Utility functions
 */

const Utils = {
    /**
     * Generate a unique ID
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Debounce function
     */
    debounce(func, delay = APP_CONFIG.DEBOUNCE_DELAY) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    /**
     * Throttle function
     */
    throttle(func, delay = APP_CONFIG.THROTTLE_DELAY) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    },
    
    /**
     * Format date
     */
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 7) {
            return d.toLocaleDateString('ja-JP');
        } else if (days > 0) {
            return `${days}日前`;
        } else if (hours > 0) {
            return `${hours}時間前`;
        } else if (minutes > 0) {
            return `${minutes}分前`;
        } else {
            return 'たった今';
        }
    },
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Parse markdown (using marked.js)
     */
    parseMarkdown(text) {
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        }
        return this.escapeHtml(text);
    },
    
    /**
     * Highlight code (using Prism.js)
     */
    highlightCode(code, language = 'javascript') {
        if (typeof Prism !== 'undefined' && Prism.languages[language]) {
            return Prism.highlight(code, Prism.languages[language], language);
        }
        return this.escapeHtml(code);
    },
    
    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback method
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    },
    
    /**
     * Download data as file
     */
    downloadFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    },
    
    /**
     * Set cookie
     */
    setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
    },
    
    /**
     * Parse SSE data
     */
    parseSSEData(data) {
        try {
            if (data === '[DONE]') {
                return { done: true };
            }
            return JSON.parse(data);
        } catch (err) {
            console.error('Error parsing SSE data:', err);
            return null;
        }
    },
    
    /**
     * Create element with classes
     */
    createElement(tag, classes = [], attributes = {}) {
        const element = document.createElement(tag);
        if (classes.length > 0) {
            element.className = classes.join(' ');
        }
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },
    
    /**
     * Auto resize textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    /**
     * Detect mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Get browser info
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = '0';
        
        if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = userAgent.match(/Firefox\/(\d+)/)[1];
        } else if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = userAgent.match(/Chrome\/(\d+)/)[1];
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
            browserVersion = userAgent.match(/Version\/(\d+)/)[1];
        }
        
        return { name: browserName, version: browserVersion };
    }
};