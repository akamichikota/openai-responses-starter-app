# FastAPI + HTML/CSS/JS 移植計画書

## プロジェクト概要

現在のNext.js AIチャットアプリケーションを、FastAPIバックエンド + 純粋なHTML/CSS/JSフロントエンドに移植し、追加機能（プログレッシブローディング、複数チャットボット対応、チャットルーム管理、パフォーマンス最適化）を実装します。

## システムアーキテクチャ設計

### 全体構成
```
Frontend (HTML/CSS/JS)
├── Static Files (HTML, CSS, JS)
├── State Management (Custom JS Store)
├── EventSource SSE Client
├── WebSocket Client (オプション)
└── Local Storage Manager

FastAPI Backend
├── Chat Streaming API
├── Chatbot Management API
├── Session Management API
├── Tool Execution Framework
├── Database Layer (PostgreSQL/SQLite)
└── OpenAI Integration Service
```

## バックエンド実装計画

### 1. FastAPI アプリケーション構造
```
app/
├── main.py                    # FastAPIアプリケーション
├── models/                    # データモデル
│   ├── chat.py               # チャット関連モデル
│   ├── user.py               # ユーザー・セッション
│   └── tools.py              # ツール定義
├── routers/                  # APIルーター
│   ├── chat.py               # チャット API
│   ├── chatbots.py           # チャットボット管理
│   ├── sessions.py           # セッション管理
│   └── tools.py              # ツール実行
├── services/                 # ビジネスロジック
│   ├── chat_service.py       # チャット処理サービス
│   ├── openai_service.py     # OpenAI統合
│   └── tool_service.py       # ツール実行サービス
├── core/                     # コア機能
│   ├── config.py             # 設定管理
│   ├── database.py           # データベース接続
│   └── security.py           # 認証・セキュリティ
└── static/                   # フロントエンドファイル
    ├── index.html
    ├── css/
    ├── js/
    └── assets/
```

### 2. データモデル設計

#### チャットメッセージモデル
```python
from pydantic import BaseModel
from typing import List, Optional, Union, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ContentType(str, Enum):
    INPUT_TEXT = "input_text"
    OUTPUT_TEXT = "output_text"
    REFUSAL = "refusal"

class ToolCallType(str, Enum):
    FUNCTION_CALL = "function_call"
    WEB_SEARCH_CALL = "web_search_call"
    FILE_SEARCH_CALL = "file_search_call"
    MCP_CALL = "mcp_call"
    CODE_INTERPRETER_CALL = "code_interpreter_call"

class Annotation(BaseModel):
    type: str
    file_id: Optional[str] = None
    container_id: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    filename: Optional[str] = None

class ContentItem(BaseModel):
    type: ContentType
    text: Optional[str] = None
    annotations: Optional[List[Annotation]] = None

class MessageItem(BaseModel):
    id: Optional[str] = None
    type: str = "message"
    role: MessageRole
    content: List[ContentItem]
    timestamp: datetime

class ToolCallItem(BaseModel):
    id: str
    type: str = "tool_call"
    tool_type: ToolCallType
    status: str = "in_progress"
    name: Optional[str] = None
    arguments: Optional[str] = None
    parsed_arguments: Optional[dict] = None
    output: Optional[str] = None
    code: Optional[str] = None
    files: Optional[List[dict]] = None
    timestamp: datetime

class ChatSession(BaseModel):
    id: str
    name: Optional[str] = None
    chatbot_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

class Chatbot(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    model: str = "gpt-4o"
    tools_enabled: List[str] = []
    config: dict = {}
    created_at: datetime
```

### 3. APIエンドポイント仕様

#### 3.1 チャットストリーミングAPI
```python
@router.post("/api/chat/stream")
async def chat_stream(
    request: ChatRequest,
    background_tasks: BackgroundTasks
):
    """
    メインチャットストリーミングエンドポイント
    
    Request:
    {
        "session_id": "string",
        "chatbot_id": "string", 
        "messages": [MessageItem],
        "tools": [Tool]
    }
    
    Response: Server-Sent Events (SSE)
    data: {"event": "response.output_text.delta", "data": {...}}
    """
    async def generate_stream():
        try:
            async for event in openai_service.stream_chat(
                request.messages, 
                request.tools,
                request.chatbot_id
            ):
                yield f"data: {json.dumps(event)}\n\n"
                
        except Exception as e:
            error_event = {
                "event": "error", 
                "data": {"message": str(e)}
            }
            yield f"data: {json.dumps(error_event)}\n\n"
            
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

#### 3.2 セッション管理API
```python
# セッション一覧取得
@router.get("/api/sessions")
async def get_sessions(skip: int = 0, limit: int = 50):
    """ユーザーのチャットセッション一覧を取得"""

# 新規セッション作成
@router.post("/api/sessions")
async def create_session(session: CreateSessionRequest):
    """新しいチャットセッションを作成"""

# セッション詳細取得
@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """特定セッションの詳細と履歴を取得"""

# セッション削除
@router.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """セッションと関連履歴を削除"""
```

#### 3.3 チャットボット管理API
```python
# チャットボット一覧
@router.get("/api/chatbots")
async def get_chatbots(
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """利用可能なチャットボット一覧を取得"""

# チャットボット詳細
@router.get("/api/chatbots/{chatbot_id}")
async def get_chatbot(chatbot_id: str):
    """特定チャットボットの設定を取得"""

# チャットボット作成・更新
@router.post("/api/chatbots")
async def create_chatbot(chatbot: CreateChatbotRequest):
    """新しいチャットボットを作成"""
```

#### 3.4 ツール実行API
```python
@router.post("/api/tools/execute")
async def execute_tool(request: ToolExecutionRequest):
    """ツール（関数）を実行して結果を返す"""
    
@router.get("/api/tools")
async def get_available_tools():
    """利用可能なツール一覧を取得"""
```

### 4. OpenAI統合サービス
```python
class OpenAIService:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    async def stream_chat(
        self, 
        messages: List[MessageItem],
        tools: List[Tool],
        chatbot_id: str
    ):
        """OpenAI Responses APIとの統合ストリーミング処理"""
        
        try:
            # チャットボット設定取得
            chatbot = await get_chatbot(chatbot_id)
            
            # メッセージフォーマット変換
            formatted_messages = self._format_messages(messages)
            
            # OpenAI API呼び出し
            response = await self.client.responses.create(
                model=chatbot.model,
                input=formatted_messages,
                instructions=chatbot.system_prompt,
                tools=tools,
                stream=True,
                parallel_tool_calls=False
            )
            
            # ストリームイベント処理
            async for event in response:
                # イベント種別に応じた処理
                processed_event = await self._process_stream_event(event)
                if processed_event:
                    yield processed_event
                    
        except Exception as e:
            logging.error(f"OpenAI streaming error: {e}")
            raise
    
    async def _process_stream_event(self, event):
        """ストリームイベントの処理とフォーマット"""
        # Next.js実装と同等のイベント処理ロジック
        pass
```

### 5. データベース設計

#### SQLAlchemy モデル
```python
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ChatSessionDB(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    chatbot_id = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    message_count = Column(Integer, default=0)
    metadata = Column(JSON, default={})

class ChatMessageDB(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    message_type = Column(String, nullable=False)  # message, tool_call
    role = Column(String, nullable=True)
    content = Column(JSON, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    order_index = Column(Integer, nullable=False)

class ChatbotDB(Base):
    __tablename__ = "chatbots"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    system_prompt = Column(Text, nullable=False)
    model = Column(String, default="gpt-4o")
    tools_config = Column(JSON, default=[])
    config = Column(JSON, default={})
    category = Column(String)
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
```

## フロントエンド実装計画

### 1. HTML構造設計

#### メインHTML (`index.html`)
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Platform</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/animations.css">
</head>
<body>
    <!-- アプリケーションコンテナ -->
    <div id="app">
        <!-- ローディングスクリーン -->
        <div id="loading-screen" class="loading-screen">
            <div class="loading-animation"></div>
        </div>
        
        <!-- サイドバー (チャットボット・セッション選択) -->
        <aside id="sidebar" class="sidebar">
            <!-- チャットボット選択 -->
            <section class="chatbot-selector">
                <div class="search-box">
                    <input type="text" id="chatbot-search" placeholder="AIアシスタントを検索...">
                </div>
                <div id="chatbot-list" class="chatbot-list"></div>
            </section>
            
            <!-- セッション管理 -->
            <section class="session-manager">
                <div class="session-header">
                    <h3>チャット履歴</h3>
                    <button id="new-session-btn" class="new-session-btn">+</button>
                </div>
                <div id="session-list" class="session-list"></div>
            </section>
        </aside>
        
        <!-- メインチャットエリア -->
        <main id="chat-container" class="chat-container">
            <!-- チャットヘッダー -->
            <header class="chat-header">
                <div class="chatbot-info">
                    <div id="current-chatbot-name"></div>
                    <div id="current-chatbot-desc"></div>
                </div>
                <div class="chat-controls">
                    <button id="clear-chat-btn">クリア</button>
                    <button id="export-chat-btn">エクスポート</button>
                </div>
            </header>
            
            <!-- メッセージエリア -->
            <div id="messages-container" class="messages-container">
                <div id="messages-list" class="messages-list"></div>
                <div id="loading-message" class="loading-message hidden">
                    <div class="loading-dots"></div>
                </div>
            </div>
            
            <!-- 入力エリア -->
            <footer class="input-container">
                <div class="input-wrapper">
                    <textarea 
                        id="message-input" 
                        placeholder="メッセージを入力..."
                        rows="1"></textarea>
                    <button id="send-button" class="send-button" disabled>
                        <svg class="send-icon">...</svg>
                    </button>
                </div>
            </footer>
        </main>
    </div>
    
    <!-- JavaScript -->
    <script src="js/utils.js"></script>
    <script src="js/storage.js"></script>
    <script src="js/api.js"></script>
    <script src="js/components.js"></script>
    <script src="js/chat.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

### 2. CSS設計

#### メインスタイル (`css/main.css`)
```css
/* CSS Variables for theme management */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-light: #f8fafc;
  --background-dark: #1a202c;
  --text-primary: #2d3748;
  --text-secondary: #718096;
  --message-user-bg: #ededed;
  --message-assistant-bg: #ffffff;
  --border-color: #e2e8f0;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  /* Animation variables */
  --transition-speed: 0.3s;
  --animation-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Dark theme */
[data-theme="dark"] {
  --background-light: #2d3748;
  --background-dark: #1a202c;
  --text-primary: #f7fafc;
  --text-secondary: #a0aec0;
  --message-assistant-bg: #2d3748;
  --border-color: #4a5568;
}

/* Layout */
#app {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar {
  width: 320px;
  background: var(--background-light);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--background-light);
}

/* Message styling */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
}

.message {
  margin-bottom: 1rem;
  animation: slideInUp 0.3s ease-out;
}

.message-user {
  display: flex;
  justify-content: flex-end;
}

.message-assistant {
  display: flex;
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  word-wrap: break-word;
}

.message-user .message-content {
  background: var(--message-user-bg);
  color: var(--text-primary);
}

.message-assistant .message-content {
  background: var(--message-assistant-bg);
  color: var(--text-primary);
  box-shadow: var(--shadow);
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    top: 0;
    left: -100%;
    transition: left var(--transition-speed);
    z-index: 1000;
  }
  
  .sidebar.open {
    left: 0;
  }
  
  .chat-container {
    width: 100%;
  }
}
```

### 3. JavaScript実装

#### 状態管理 (`js/storage.js`)
```javascript
class ChatStore {
    constructor() {
        this.state = {
            currentSession: null,
            sessions: [],
            chatbots: [],
            messages: [],
            isLoading: false,
            currentChatbot: null
        };
        
        this.listeners = [];
        this.loadFromStorage();
    }
    
    // 状態更新とリスナー通知
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveToStorage();
        this.notifyListeners();
    }
    
    // ローカルストレージ操作
    saveToStorage() {
        try {
            const storageData = {
                sessions: this.state.sessions,
                currentSession: this.state.currentSession,
                currentChatbot: this.state.currentChatbot
            };
            localStorage.setItem('chatAppState', JSON.stringify(storageData));
        } catch (error) {
            console.error('Storage save error:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('chatAppState');
            if (stored) {
                const data = JSON.parse(stored);
                this.state = { ...this.state, ...data };
            }
        } catch (error) {
            console.error('Storage load error:', error);
        }
    }
    
    // リスナー管理
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.state));
    }
}

// グローバル状態インスタンス
const chatStore = new ChatStore();
```

#### API通信 (`js/api.js`)
```javascript
class ChatAPI {
    constructor(baseURL) {
        this.baseURL = baseURL || '';
        this.eventSource = null;
    }
    
    // SSEストリーミングチャット
    async streamChat(sessionId, chatbotId, messages, onMessage, onError, onComplete) {
        try {
            const response = await fetch(`${this.baseURL}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    chatbot_id: chatbotId,
                    messages: messages
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '[DONE]') {
                                onComplete?.();
                                return;
                            }
                            
                            try {
                                const event = JSON.parse(dataStr);
                                onMessage(event);
                            } catch (e) {
                                console.error('JSON parse error:', e);
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
            
        } catch (error) {
            console.error('Stream chat error:', error);
            onError?.(error);
        }
    }
    
    // セッション管理
    async createSession(chatbotId, name) {
        return this.request('POST', '/api/sessions', {
            chatbot_id: chatbotId,
            name: name
        });
    }
    
    async getSessions() {
        return this.request('GET', '/api/sessions');
    }
    
    async getSession(sessionId) {
        return this.request('GET', `/api/sessions/${sessionId}`);
    }
    
    // チャットボット管理
    async getChatbots(search, category) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        
        return this.request('GET', `/api/chatbots?${params}`);
    }
    
    // 汎用リクエストヘルパー
    async request(method, url, data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${this.baseURL}${url}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
}

// グローバルAPIインスタンス
const chatAPI = new ChatAPI();
```

#### チャット機能 (`js/chat.js`)
```javascript
class ChatManager {
    constructor(api, store) {
        this.api = api;
        this.store = store;
        this.isStreaming = false;
        this.currentMessageId = null;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // 送信ボタン
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        
        sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter送信（Shift+Enterで改行）
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !this.isComposing) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // IME対応
        messageInput.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });
        
        messageInput.addEventListener('compositionend', () => {
            this.isComposing = false;
        });
        
        // 自動リサイズ
        messageInput.addEventListener('input', () => {
            this.autoResizeTextarea(messageInput);
            this.updateSendButton();
        });
    }
    
    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || this.isStreaming) return;
        
        const { currentSession, currentChatbot } = this.store.state;
        
        if (!currentSession || !currentChatbot) {
            alert('チャットボットとセッションを選択してください');
            return;
        }
        
        // ユーザーメッセージを追加
        const userMessage = {
            id: this.generateId(),
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: message }],
            timestamp: new Date().toISOString()
        };
        
        this.addMessage(userMessage);
        input.value = '';
        this.updateSendButton();
        this.setLoadingState(true);
        
        // メッセージ履歴を準備
        const messages = [...this.store.state.messages, userMessage];
        
        let assistantMessage = null;
        let currentText = '';
        
        try {
            await this.api.streamChat(
                currentSession.id,
                currentChatbot.id,
                messages,
                // onMessage
                (event) => {
                    this.handleStreamEvent(event, assistantMessage, currentText);
                },
                // onError
                (error) => {
                    console.error('Chat error:', error);
                    this.setLoadingState(false);
                    this.showError('送信エラーが発生しました');
                },
                // onComplete
                () => {
                    this.setLoadingState(false);
                }
            );
        } catch (error) {
            this.setLoadingState(false);
            this.showError('メッセージの送信に失敗しました');
        }
    }
    
    handleStreamEvent(event, assistantMessage, currentText) {
        switch (event.event) {
            case 'response.output_text.delta':
                currentText += event.data.delta || '';
                
                if (!assistantMessage) {
                    assistantMessage = {
                        id: event.data.item_id,
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'output_text', text: currentText }],
                        timestamp: new Date().toISOString()
                    };
                    this.addMessage(assistantMessage);
                } else {
                    assistantMessage.content[0].text = currentText;
                    this.updateMessage(assistantMessage);
                }
                break;
                
            case 'response.function_call_arguments.delta':
                // ツールコール処理
                this.handleToolCallDelta(event);
                break;
                
            case 'response.output_item.added':
                // 新規アイテム追加
                this.handleNewItem(event);
                break;
                
            // 他のイベント処理...
        }
    }
    
    addMessage(message) {
        const messages = [...this.store.state.messages, message];
        this.store.setState({ messages });
        this.renderMessage(message);
        this.scrollToBottom();
    }
    
    updateMessage(message) {
        const messages = this.store.state.messages.map(m => 
            m.id === message.id ? message : m
        );
        this.store.setState({ messages });
        this.updateMessageElement(message);
    }
    
    renderMessage(message) {
        const container = document.getElementById('messages-list');
        const messageElement = this.createMessageElement(message);
        container.appendChild(messageElement);
    }
    
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message message-${message.role}`;
        div.setAttribute('data-message-id', message.id);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        if (message.type === 'message') {
            // Markdown処理
            content.innerHTML = this.processMarkdown(message.content[0].text);
        } else if (message.type === 'tool_call') {
            // ツールコール表示
            content.appendChild(this.createToolCallElement(message));
        }
        
        div.appendChild(content);
        
        // アニメーション
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
            div.style.transition = 'all 0.3s ease-out';
        });
        
        return div;
    }
    
    setLoadingState(loading) {
        this.isStreaming = loading;
        const sendButton = document.getElementById('send-button');
        const loadingMessage = document.getElementById('loading-message');
        
        sendButton.disabled = loading;
        loadingMessage.classList.toggle('hidden', !loading);
        
        if (loading) {
            this.scrollToBottom();
        }
    }
    
    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }
    
    processMarkdown(text) {
        // 簡易Markdown処理（実際の実装では marked.js等を使用）
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    generateId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    updateSendButton() {
        const input = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        sendButton.disabled = !input.value.trim() || this.isStreaming;
    }
    
    showError(message) {
        // エラー表示の実装
        console.error(message);
    }
}
```

### 4. プログレッシブローディング実装

#### アニメーション管理 (`js/animations.js`)
```javascript
class ProgressiveLoader {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '50px'
        };
        
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            this.observerOptions
        );
    }
    
    // スケルトンローディング
    createSkeletonMessage() {
        const skeleton = document.createElement('div');
        skeleton.className = 'message message-assistant skeleton';
        skeleton.innerHTML = `
            <div class="message-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
            </div>
        `;
        return skeleton;
    }
    
    // プログレッシブ表示
    animateMessageIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px) scale(0.95)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    // 段階的コンテンツ表示
    revealContentProgressively(element, delay = 100) {
        const children = Array.from(element.children);
        
        children.forEach((child, index) => {
            child.style.opacity = '0';
            child.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                child.style.transition = 'all 0.4s ease-out';
                child.style.opacity = '1';
                child.style.transform = 'translateX(0)';
            }, delay * index);
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.animateMessageIn(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    observeElement(element) {
        this.observer.observe(element);
    }
}
```

### 5. パフォーマンス最適化

#### 仮想スクロール実装 (`js/virtual-scroll.js`)
```javascript
class VirtualScroll {
    constructor(container, itemHeight = 100) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 5;
        this.startIndex = 0;
        this.endIndex = this.visibleItems;
        
        this.setupVirtualContainer();
        this.bindScrollEvent();
    }
    
    setupVirtualContainer() {
        this.virtualContainer = document.createElement('div');
        this.virtualContainer.className = 'virtual-container';
        this.container.appendChild(this.virtualContainer);
    }
    
    bindScrollEvent() {
        this.container.addEventListener('scroll', 
            this.throttle(this.handleScroll.bind(this), 16)
        );
    }
    
    handleScroll() {
        const scrollTop = this.container.scrollTop;
        const newStartIndex = Math.floor(scrollTop / this.itemHeight);
        const newEndIndex = newStartIndex + this.visibleItems;
        
        if (newStartIndex !== this.startIndex) {
            this.startIndex = newStartIndex;
            this.endIndex = newEndIndex;
            this.renderVisibleItems();
        }
    }
    
    renderVisibleItems() {
        // 表示範囲のアイテムのみレンダリング
        const fragment = document.createDocumentFragment();
        
        for (let i = this.startIndex; i < this.endIndex && i < this.items.length; i++) {
            const item = this.createItemElement(this.items[i], i);
            fragment.appendChild(item);
        }
        
        this.virtualContainer.innerHTML = '';
        this.virtualContainer.appendChild(fragment);
        
        // スペーサー要素でスクロール位置調整
        this.updateSpacers();
    }
    
    updateSpacers() {
        const totalHeight = this.items.length * this.itemHeight;
        const topSpacerHeight = this.startIndex * this.itemHeight;
        const bottomSpacerHeight = totalHeight - (this.endIndex * this.itemHeight);
        
        this.virtualContainer.style.paddingTop = `${topSpacerHeight}px`;
        this.virtualContainer.style.paddingBottom = `${Math.max(0, bottomSpacerHeight)}px`;
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}
```

## 実装フェーズ計画

### Phase 1: 基盤構築（1週間）
- [ ] FastAPIアプリケーションセットアップ
- [ ] データベース設計・実装
- [ ] 基本APIエンドポイント実装
- [ ] フロントエンド基本構造構築

### Phase 2: コアチャット機能（1週間）
- [ ] ストリーミングチャット実装
- [ ] メッセージ送受信機能
- [ ] 状態管理システム
- [ ] ローカルストレージ統合

### Phase 3: 高度な機能（1週間）
- [ ] 複数チャットボット対応
- [ ] セッション管理機能
- [ ] ツールコール表示
- [ ] プログレッシブローディング

### Phase 4: 最適化・完成（1週間）
- [ ] パフォーマンス最適化
- [ ] レスポンシブデザイン
- [ ] エラーハンドリング強化
- [ ] テスト・デバッグ

## 技術要件・制約

### 必須ライブラリ
- **バックエンド**: FastAPI, SQLAlchemy, OpenAI, Pydantic
- **フロントエンド**: マークダウンパーサー (marked.js), 構文ハイライト (Prism.js)

### パフォーマンス目標
- 初回読み込み時間: 3秒以内
- メッセージ送信レスポンス: 100ms以内
- ストリーミング遅延: 50ms以内
- メモリ使用量: 100MB以内（10,000メッセージ時）

この移植計画により、現在のNext.jsアプリケーションを完全に再現し、さらに追加機能を含む高性能なAIチャットプラットフォームを実現できます。