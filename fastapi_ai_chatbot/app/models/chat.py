"""
Chat session and message models
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class MessageRole(str, enum.Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class MessageType(str, enum.Enum):
    """Message type enumeration"""
    MESSAGE = "message"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    ERROR = "error"
    INFO = "info"


class ChatSession(Base):
    """Chat session model"""
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    chatbot_id = Column(String, ForeignKey("chatbots.id"), nullable=False)
    
    # Session metadata
    message_count = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    
    # Session configuration
    temperature_override = Column(JSON, nullable=True)
    system_prompt_override = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_activity = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    chatbot = relationship("Chatbot", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "name": self.name or f"Chat {self.created_at.strftime('%Y-%m-%d %H:%M')}",
            "user_id": self.user_id,
            "chatbot_id": self.chatbot_id,
            "message_count": self.message_count,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
        }


class ChatMessage(Base):
    """Chat message model"""
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    
    # Message content
    role = Column(SQLEnum(MessageRole), nullable=False)
    message_type = Column(SQLEnum(MessageType), nullable=False, default=MessageType.MESSAGE)
    content = Column(JSON, nullable=False)  # Store structured content
    raw_content = Column(Text, nullable=True)  # Store raw text for search
    
    # Tool-related fields
    tool_name = Column(String, nullable=True)
    tool_call_id = Column(String, nullable=True, index=True)
    tool_arguments = Column(JSON, nullable=True)
    tool_output = Column(JSON, nullable=True)
    
    # Metadata
    tokens_used = Column(Integer, default=0)
    processing_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    is_hidden = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role.value if self.role else None,
            "message_type": self.message_type.value if self.message_type else None,
            "content": self.content,
            "tool_name": self.tool_name,
            "tool_call_id": self.tool_call_id,
            "tool_arguments": self.tool_arguments,
            "tool_output": self.tool_output,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
    def to_openai_format(self):
        """Convert to OpenAI API message format"""
        if self.message_type == MessageType.MESSAGE:
            if self.role == MessageRole.USER:
                return {"role": "user", "content": self.raw_content or ""}
            elif self.role == MessageRole.ASSISTANT:
                return {"role": "assistant", "content": self.raw_content or ""}
            elif self.role == MessageRole.SYSTEM:
                return {"role": "system", "content": self.raw_content or ""}
        return None