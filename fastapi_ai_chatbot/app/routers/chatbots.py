"""
Chatbot management API routes
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from pydantic import BaseModel

from app.core.database import get_db
from app.models.chatbot import Chatbot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbots", tags=["chatbots"])


class ChatbotResponse(BaseModel):
    """Chatbot response model"""
    id: str
    name: str
    slug: str
    description: Optional[str]
    avatar_url: Optional[str]
    category: str
    model: str
    suggested_prompts: List[str]
    theme_color: str
    is_featured: bool
    is_premium: bool
    tags: List[str]
    usage_count: int
    rating: float
    tools_enabled: List[str]


class CreateChatbotRequest(BaseModel):
    """Create chatbot request model"""
    name: str
    slug: str
    description: Optional[str] = None
    category: str = "general"
    model: str = "gpt-4o"
    system_prompt: str
    suggested_prompts: List[str] = []
    theme_color: str = "#667eea"
    tools_enabled: List[str] = []


@router.get("/", response_model=List[ChatbotResponse])
async def get_chatbots(
    search: Optional[str] = Query(None, description="Search term"),
    category: Optional[str] = Query(None, description="Filter by category"),
    featured: Optional[bool] = Query(None, description="Filter featured bots"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
) -> List[ChatbotResponse]:
    """Get available chatbots with optional filtering"""
    try:
        query = select(Chatbot).where(Chatbot.is_active == True)
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Chatbot.name.ilike(search_term),
                    Chatbot.description.ilike(search_term)
                )
            )
        
        if category:
            query = query.where(Chatbot.category == category)
        
        if featured is not None:
            query = query.where(Chatbot.is_featured == featured)
        
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        # Order by featured and usage
        query = query.order_by(
            Chatbot.is_featured.desc(),
            Chatbot.usage_count.desc()
        )
        
        result = await db.execute(query)
        chatbots = result.scalars().all()
        
        return [
            ChatbotResponse(
                id=bot.id,
                name=bot.name,
                slug=bot.slug,
                description=bot.description,
                avatar_url=bot.avatar_url,
                category=bot.category,
                model=bot.model,
                suggested_prompts=bot.suggested_prompts or [],
                theme_color=bot.theme_color,
                is_featured=bot.is_featured,
                is_premium=bot.is_premium,
                tags=bot.tags or [],
                usage_count=bot.usage_count,
                rating=bot.rating,
                tools_enabled=bot.tools_enabled or []
            )
            for bot in chatbots
        ]
        
    except Exception as e:
        logger.error(f"Error getting chatbots: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chatbots")


@router.get("/{chatbot_id}", response_model=ChatbotResponse)
async def get_chatbot(
    chatbot_id: str,
    db: AsyncSession = Depends(get_db)
) -> ChatbotResponse:
    """Get a specific chatbot by ID"""
    try:
        chatbot = await db.get(Chatbot, chatbot_id)
        
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        
        # Increment usage count
        chatbot.usage_count += 1
        await db.commit()
        
        return ChatbotResponse(
            id=chatbot.id,
            name=chatbot.name,
            slug=chatbot.slug,
            description=chatbot.description,
            avatar_url=chatbot.avatar_url,
            category=chatbot.category,
            model=chatbot.model,
            suggested_prompts=chatbot.suggested_prompts or [],
            theme_color=chatbot.theme_color,
            is_featured=chatbot.is_featured,
            is_premium=chatbot.is_premium,
            tags=chatbot.tags or [],
            usage_count=chatbot.usage_count,
            rating=chatbot.rating,
            tools_enabled=chatbot.tools_enabled or []
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chatbot: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chatbot")


@router.get("/slug/{slug}", response_model=ChatbotResponse)
async def get_chatbot_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
) -> ChatbotResponse:
    """Get a chatbot by slug"""
    try:
        query = select(Chatbot).where(Chatbot.slug == slug)
        result = await db.execute(query)
        chatbot = result.scalar_one_or_none()
        
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        
        # Increment usage count
        chatbot.usage_count += 1
        await db.commit()
        
        return ChatbotResponse(
            id=chatbot.id,
            name=chatbot.name,
            slug=chatbot.slug,
            description=chatbot.description,
            avatar_url=chatbot.avatar_url,
            category=chatbot.category,
            model=chatbot.model,
            suggested_prompts=chatbot.suggested_prompts or [],
            theme_color=chatbot.theme_color,
            is_featured=chatbot.is_featured,
            is_premium=chatbot.is_premium,
            tags=chatbot.tags or [],
            usage_count=chatbot.usage_count,
            rating=chatbot.rating,
            tools_enabled=chatbot.tools_enabled or []
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chatbot by slug: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chatbot")


@router.get("/categories/list")
async def get_categories(
    db: AsyncSession = Depends(get_db)
) -> List[str]:
    """Get list of available chatbot categories"""
    try:
        query = select(Chatbot.category).distinct()
        result = await db.execute(query)
        categories = result.scalars().all()
        
        return sorted(categories)
        
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get categories")