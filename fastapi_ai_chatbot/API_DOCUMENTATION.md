# FastAPI AI Chatbot - API Documentation

## 概要

このFastAPIアプリケーションは、OpenAIのGPTモデルを使用したリアルタイムチャット機能を提供するREST APIです。複数のチャットボット、セッション管理、ストリーミングレスポンス、チャット履歴の管理などの機能を提供します。

## ベースURL

```
http://localhost:8000
```

## 認証

現在、このAPIは匿名ユーザーをサポートしており、認証は不要です。全てのリクエストは自動的に匿名ユーザーとして処理されます。

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "data": { ... },
  "message": "Success"
}
```

### エラーレスポンス
```json
{
  "detail": "エラーメッセージ"
}
```

---

# エンドポイント一覧

## 1. ヘルスチェック

### `GET /health`

アプリケーションの健康状態を確認します。

**レスポンス:**
```json
{
  "status": "healthy",
  "app": "AI Chat Platform",
  "version": "1.0.0"
}
```

---

# チャットボット関連エンドポイント

## 2. チャットボット一覧取得

### `GET /api/chatbots`

利用可能な全てのチャットボットの一覧を取得します。

**クエリパラメータ:**
- `category` (optional): カテゴリでフィルター
- `featured` (optional): 注目のチャットボットのみ取得 (true/false)
- `limit` (optional): 取得件数の上限 (デフォルト: 50)
- `offset` (optional): オフセット (デフォルト: 0)

**レスポンス例:**
```json
[
  {
    "id": "general_assistant",
    "name": "汎用アシスタント",
    "slug": "general-assistant",
    "description": "様々な質問にお答えします",
    "avatar_url": null,
    "category": "general",
    "model": "gpt-4o",
    "system_prompt": "あなたは親切で知識豊富なAIアシスタントです...",
    "welcome_message": "こんにちは！何かお手伝いできることはありますか？",
    "suggested_prompts": ["今日の天気について", "プログラミングについて教えて"],
    "theme_color": "#667eea",
    "is_featured": true,
    "is_premium": false,
    "tags": ["general", "assistant"],
    "usage_count": 150,
    "rating": 4.5,
    "tools_enabled": []
  }
]
```

## 3. 特定のチャットボット取得

### `GET /api/chatbots/{chatbot_id}`

指定されたIDのチャットボットの詳細情報を取得します。

**パスパラメータ:**
- `chatbot_id`: チャットボットのID

**レスポンス例:**
```json
{
  "id": "code_assistant",
  "name": "コードアシスタント",
  "slug": "code-assistant",
  "description": "プログラミングに関する質問にお答えします",
  "category": "programming",
  "model": "gpt-4o",
  "system_prompt": "あなたは経験豊富なプログラマーです...",
  "welcome_message": "プログラミングに関する質問をお聞かせください",
  "suggested_prompts": ["Pythonのエラーを修正して", "APIの設計について"],
  "theme_color": "#10b981",
  "is_featured": true,
  "is_premium": false,
  "tags": ["programming", "code"],
  "usage_count": 89,
  "rating": 4.7,
  "tools_enabled": ["code_interpreter"]
}
```

## 4. スラグでチャットボット取得

### `GET /api/chatbots/slug/{slug}`

指定されたスラグのチャットボットを取得します。

**パスパラメータ:**
- `slug`: チャットボットのスラグ (例: "code-assistant")

**レスポンス:** チャットボット詳細情報（上記と同様）

## 5. カテゴリ一覧取得

### `GET /api/chatbots/categories/list`

利用可能なチャットボットカテゴリの一覧を取得します。

**レスポンス例:**
```json
{
  "categories": ["general", "programming", "creative", "business", "language", "analysis"]
}
```

---

# チャット関連エンドポイント

## 6. チャットストリーミング

### `POST /api/chat/stream`

リアルタイムでチャットレスポンスをServer-Sent Events (SSE) 形式でストリーミングします。

**リクエストボディ:**
```json
{
  "session_id": "session_12345",
  "message": "こんにちは、Pythonについて教えてください",
  "tools": []
}
```

**レスポンス:**
Server-Sent Eventsストリームとして返されます。

**イベントタイプ:**

1. **テキストデルタ** - リアルタイムでテキストが生成される
```
data: {"event": "response.output_text.delta", "data": {"delta": "こんにちは", "item_id": "msg_123"}}
```

2. **完了イベント** - レスポンス完了時
```
data: {"event": "response.output_item.done", "data": {"item": {"type": "message", "role": "assistant", "content": [...]}}}
```

3. **エラーイベント**
```
data: {"event": "error", "data": {"message": "エラーメッセージ"}}
```

4. **終了シグナル**
```
data: [DONE]
```

**JavaScriptでの使用例:**
```javascript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'session_12345',
    message: 'こんにちは',
    tools: []
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      
      try {
        const event = JSON.parse(data);
        console.log('イベント:', event);
      } catch (e) {
        console.error('パースエラー:', e);
      }
    }
  }
}
```

## 7. セッション作成

### `POST /api/chat/sessions`

新しいチャットセッションを作成します。

**リクエストボディ:**
```json
{
  "chatbot_id": "general_assistant",
  "name": "新しいチャット"
}
```

**レスポンス例:**
```json
{
  "id": "session_67890",
  "name": "新しいチャット",
  "chatbot_id": "general_assistant",
  "message_count": 0,
  "created_at": "2025-01-20T10:30:00Z",
  "last_activity": "2025-01-20T10:30:00Z"
}
```

## 8. セッション一覧取得

### `GET /api/chat/sessions`

ユーザーのチャットセッション一覧を取得します。

**クエリパラメータ:**
- `limit` (optional): 取得件数 (1-100, デフォルト: 50)
- `offset` (optional): オフセット (デフォルト: 0)

**レスポンス例:**
```json
[
  {
    "id": "session_67890",
    "name": "新しいチャット",
    "chatbot_id": "general_assistant", 
    "message_count": 5,
    "created_at": "2025-01-20T10:30:00Z",
    "last_activity": "2025-01-20T11:15:00Z"
  },
  {
    "id": "session_67891",
    "name": "プログラミング相談",
    "chatbot_id": "code_assistant",
    "message_count": 12,
    "created_at": "2025-01-19T14:20:00Z",
    "last_activity": "2025-01-19T15:45:00Z"
  }
]
```

## 9. セッション詳細取得

### `GET /api/chat/sessions/{session_id}`

指定されたセッションの詳細とメッセージ履歴を取得します。

**パスパラメータ:**
- `session_id`: セッションID

**レスポンス例:**
```json
{
  "session": {
    "id": "session_67890",
    "name": "新しいチャット",
    "chatbot_id": "general_assistant",
    "message_count": 3,
    "created_at": "2025-01-20T10:30:00Z",
    "last_activity": "2025-01-20T11:15:00Z"
  },
  "chatbot": {
    "id": "general_assistant",
    "name": "汎用アシスタント",
    "description": "様々な質問にお答えします"
  },
  "messages": [
    {
      "id": "msg_001",
      "role": "user", 
      "content": "こんにちは",
      "created_at": "2025-01-20T10:31:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "こんにちは！何かお手伝いできることはありますか？",
      "created_at": "2025-01-20T10:31:05Z"
    }
  ]
}
```

## 10. セッション削除

### `DELETE /api/chat/sessions/{session_id}`

指定されたセッションを削除します。

**パスパラメータ:**
- `session_id`: セッションID

**レスポンス例:**
```json
{
  "message": "Session deleted successfully"
}
```

## 11. 全セッション一括削除

### `DELETE /api/chat/sessions/bulk-delete`

ユーザーの全てのセッションを削除します。

**レスポンス例:**
```json
{
  "message": "Deleted 15 sessions"
}
```

## 12. セッションエクスポート

### `GET /api/chat/sessions/{session_id}/export`

セッションをMarkdownまたはJSON形式でエクスポートします。

**パスパラメータ:**
- `session_id`: セッションID

**クエリパラメータ:**
- `format`: エクスポート形式 ("json" または "markdown", デフォルト: "json")

**レスポンス例 (JSON形式):**
```json
{
  "session": {
    "id": "session_67890",
    "name": "新しいチャット",
    "created_at": "2025-01-20T10:30:00Z"
  },
  "messages": [
    {
      "role": "user",
      "content": "こんにちは",
      "timestamp": "2025-01-20T10:31:00Z"
    },
    {
      "role": "assistant", 
      "content": "こんにちは！何かお手伝いできることはありますか？",
      "timestamp": "2025-01-20T10:31:05Z"
    }
  ],
  "exported_at": "2025-01-20T12:00:00Z"
}
```

**レスポンス例 (Markdown形式):**
```json
{
  "content": "# 新しいチャット\\n\\n**エクスポート日時:** 2025-01-20T12:00:00Z\\n\\n## メッセージ履歴\\n\\n**ユーザー** (2025-01-20T10:31:00Z):\\nこんにちは\\n\\n**アシスタント** (2025-01-20T10:31:05Z):\\nこんにちは！何かお手伝いできることはありますか？\\n"
}
```

## 13. 空のセッション削除

### `DELETE /api/chat/sessions/cleanup-empty`

メッセージが存在しない空のセッションを一括削除します。

**レスポンス例:**
```json
{
  "message": "Deleted 3 empty sessions"
}
```

---

# エラーコード

| ステータスコード | 説明 | 例 |
|---|---|---|
| 200 | 成功 | リクエストが正常に処理された |
| 404 | 見つからない | セッションまたはチャットボットが見つからない |
| 500 | サーバーエラー | 内部サーバーエラー |

---

# 使用例

## 基本的なチャットフロー

### 1. チャットボット一覧を取得
```javascript
const chatbots = await fetch('/api/chatbots').then(r => r.json());
console.log(chatbots);
```

### 2. セッションを作成
```javascript
const session = await fetch('/api/chat/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatbot_id: 'general_assistant',
    name: '新しいチャット'
  })
}).then(r => r.json());
```

### 3. ストリーミングチャットを開始
```javascript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: session.id,
    message: 'こんにちは！',
    tools: []
  })
});

// ストリーミングレスポンスを処理
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // SSEイベントを処理
  const chunk = decoder.decode(value);
  // ... (前述の処理を参照)
}
```

### 4. セッション履歴を取得
```javascript
const sessionDetail = await fetch(`/api/chat/sessions/${session.id}`)
  .then(r => r.json());
console.log(sessionDetail.messages);
```

### 5. セッションをエクスポート
```javascript
const exportData = await fetch(`/api/chat/sessions/${session.id}/export?format=markdown`)
  .then(r => r.json());
console.log(exportData.content);
```

## React/Vue.jsでの統合例

### React Hooks例
```javascript
import { useState, useEffect } from 'react';

function useChatbot() {
  const [chatbots, setChatbots] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);

  // チャットボット一覧を取得
  useEffect(() => {
    fetch('/api/chatbots')
      .then(r => r.json())
      .then(setChatbots);
  }, []);

  // セッション作成
  const createSession = async (chatbotId, name) => {
    const session = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatbot_id: chatbotId, name })
    }).then(r => r.json());
    
    setCurrentSession(session);
    setMessages([]);
    return session;
  };

  // メッセージ送信
  const sendMessage = async (message) => {
    if (!currentSession) return;

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: currentSession.id,
        message,
        tools: []
      })
    });

    // ストリーミング処理
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const event = JSON.parse(data);
            if (event.event === 'response.output_text.delta') {
              assistantMessage += event.data.delta || '';
              // UIを更新
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = assistantMessage;
                } else {
                  newMessages.push({
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date().toISOString()
                  });
                }
                return newMessages;
              });
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }
  };

  return {
    chatbots,
    currentSession,
    messages,
    createSession,
    sendMessage
  };
}
```

---

# 注意事項

## レート制限
現在、レート制限は実装されていませんが、本番環境では適切なレート制限を設定することを推奨します。

## CORS設定
開発環境では全てのオリジンが許可されています。本番環境では適切なCORS設定を行ってください。

## セキュリティ
- 現在は匿名ユーザーのみをサポートしていますが、本番環境では適切な認証・認可機能の実装を推奨します
- APIキーなどの機密情報は環境変数で管理してください

## パフォーマンス
- 大量のメッセージを含むセッションの場合、ページネーションの実装を検討してください
- ストリーミングレスポンスを適切にハンドリングし、メモリリークを防いでください

---

# サポート

何かご質問がございましたら、GitHubのIssuesまでお気軽にお問い合わせください。

**API バージョン:** 1.0.0  
**最終更新:** 2025-01-20