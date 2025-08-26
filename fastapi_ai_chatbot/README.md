# 🤖 AI Chat Platform - FastAPI Edition

A modern, high-performance AI chat application built with FastAPI and vanilla JavaScript. Features real-time streaming, multiple AI assistants, chat history management, and progressive loading animations.

## ✨ Features

### Core Functionality
- 🔥 **Real-time Streaming** - Server-Sent Events (SSE) for instant AI responses
- 🤝 **Multiple AI Assistants** - Choose from specialized chatbots for different tasks
- 💾 **Persistent Chat History** - Automatic saving and session management
- 📝 **Markdown Support** - Rich text formatting with code highlighting
- 🌏 **Multi-language Support** - Full Japanese and English support

### Advanced Features
- 🎨 **Progressive Loading** - Smooth animations and skeleton loading
- 🌙 **Dark Mode** - Eye-friendly dark theme
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🚀 **Performance Optimized** - Virtual scrolling and lazy loading
- 🔧 **Tool Integration** - Function calling, web search, code execution
- 📊 **Session Management** - Multiple concurrent chat sessions

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
cd fastapi_ai_chatbot
```

2. **Set up Python virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

5. **Run the application**
```bash
python run.py
```

6. **Open in browser**
```
http://localhost:8000
```

## 📋 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
DATABASE_URL=sqlite+aiosqlite:///./chat_app.db
SECRET_KEY=your_secret_key_here
APP_PORT=8000
```

### Available Chatbots

The application comes with pre-configured AI assistants:

- **General Assistant** - Multi-purpose AI for general queries
- **Code Expert** - Programming and software development specialist
- **Creative Writer** - Content creation and writing assistance
- **Data Analyst** - Data analysis and visualization expert
- **Language Tutor** - Language learning support
- **Business Advisor** - Business strategy and management

## 🏗️ Architecture

### Backend (FastAPI)
```
app/
├── main.py              # FastAPI application
├── models/              # Database models
│   ├── chat.py         # Chat session and messages
│   ├── chatbot.py      # Chatbot configurations
│   └── user.py         # User and session management
├── routers/            # API endpoints
│   ├── chat.py         # Chat streaming endpoints
│   └── chatbots.py     # Chatbot management
├── services/           # Business logic
│   ├── openai_service.py  # OpenAI integration
│   └── chat_service.py    # Chat management
└── core/               # Core configurations
    ├── config.py       # Application settings
    └── database.py     # Database setup
```

### Frontend (HTML/CSS/JS)
```
static/
├── index.html          # Main application
├── css/
│   └── nextjs-style.css # NextJS-style styles and animations
└── js/
    ├── config.js      # Application configuration
    ├── utils.js       # Utility functions
    ├── storage.js     # Local storage management
    ├── api.js         # API communication
    ├── chat.js        # NextJS-style chat logic
    ├── ui.js          # NextJS-style UI management
    └── app.js         # Main application
```

## 📚 API Documentation

### Endpoints

#### Chat Endpoints
- `POST /api/chat/stream` - Stream chat responses
- `POST /api/chat/sessions` - Create new session
- `GET /api/chat/sessions` - List user sessions
- `GET /api/chat/sessions/{id}` - Get session details
- `DELETE /api/chat/sessions/{id}` - Delete session
- `GET /api/chat/sessions/{id}/export` - Export chat

#### Chatbot Endpoints
- `GET /api/chatbots` - List available chatbots
- `GET /api/chatbots/{id}` - Get chatbot details
- `GET /api/chatbots/categories/list` - List categories

### Interactive API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎨 Customization

### Adding New Chatbots

Edit `app/utils/seed_data.py` to add new chatbot configurations:

```python
Chatbot(
    name="Your Bot Name",
    slug="your-bot-slug",
    description="Bot description",
    category="category",
    model="gpt-4o",
    system_prompt="Your system prompt",
    welcome_message="Welcome message",
    suggested_prompts=["Prompt 1", "Prompt 2"],
    theme_color="#667eea"
)
```

### Styling

Customize the appearance by editing CSS variables in `static/css/style.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --bg-primary: #ffffff;
    --text-primary: #111827;
}
```

## 🧪 Development

### Running in Development Mode

```bash
# With auto-reload
python run.py

# Or using uvicorn directly
uvicorn app.main:app --reload --port 8000
```

### Database Management

```bash
# Create database tables
python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"

# Reset database
rm chat_app.db
python run.py  # Will recreate database on startup
```

## 🚢 Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment-specific Settings

For production, update `.env`:

```env
APP_RELOAD=false
DEBUG=false
DATABASE_URL=postgresql://user:pass@localhost/dbname
SECRET_KEY=strong_random_secret_key
```

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Ensure your API key is correctly set in `.env`
   - Check API key permissions and quotas

2. **Database Connection Error**
   - Ensure SQLite is installed
   - Check file permissions for database file

3. **CORS Issues**
   - Update `CORS_ORIGINS` in `.env` with your domain

4. **Port Already in Use**
   - Change `APP_PORT` in `.env` to a different port

### Logs

Check application logs for detailed error information:

```bash
# Enable debug logging
python run.py --log-level debug
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [OpenAI API](https://openai.com/)
- UI inspired by modern chat applications
- Markdown rendering by [marked.js](https://marked.js.org/)
- Code highlighting by [Prism.js](https://prismjs.com/)

## 📞 Support

For issues and questions, please create an issue on the repository.

---

Made with ❤️ using FastAPI and JavaScript