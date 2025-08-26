"""
Chatbot model for managing different AI assistants
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, Integer, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Chatbot(Base):
    """Chatbot configuration model"""
    __tablename__ = "chatbots"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    category = Column(String, nullable=False, default="general")
    
    # AI Configuration
    model = Column(String, default="gpt-4o")
    system_prompt = Column(Text, nullable=False)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)
    top_p = Column(Float, default=1.0)
    frequency_penalty = Column(Float, default=0.0)
    presence_penalty = Column(Float, default=0.0)
    
    # Tools and capabilities
    tools_enabled = Column(JSON, default=list)  # List of enabled tool names
    capabilities = Column(JSON, default=dict)   # Additional capabilities config
    
    # UI Configuration
    suggested_prompts = Column(JSON, default=list)  # List of suggested prompts
    theme_color = Column(String, default="#667eea")
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    usage_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="chatbot", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "avatar_url": self.avatar_url,
            "category": self.category,
            "model": self.model,
            "suggested_prompts": self.suggested_prompts,
            "theme_color": self.theme_color,
            "is_featured": self.is_featured,
            "is_premium": self.is_premium,
            "tags": self.tags,
            "usage_count": self.usage_count,
            "rating": self.rating,
            "tools_enabled": self.tools_enabled,
        }