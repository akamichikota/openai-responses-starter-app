"""
Chat management service
"""

import json
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession, ChatMessage, MessageRole, MessageType
from app.models.chatbot import Chatbot
from app.models.user import User
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing chat sessions and messages"""
    
    @staticmethod
    async def create_session(
        db: AsyncSession,
        user_id: str,
        chatbot_id: str,
        name: Optional[str] = None
    ) -> ChatSession:
        """
        Create a new chat session
        
        Args:
            db: Database session
            user_id: User ID
            chatbot_id: Chatbot ID
            name: Optional session name
            
        Returns:
            Created chat session
        """
        # Get chatbot to ensure it exists
        chatbot = await db.get(Chatbot, chatbot_id)
        if not chatbot:
            raise ValueError(f"Chatbot {chatbot_id} not found")
        
        # Create session
        session = ChatSession(
            user_id=user_id,
            chatbot_id=chatbot_id,
            name=name or f"Chat with {chatbot.name}"
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        # Welcome messages removed per user request
        
        logger.info(f"Created chat session {session.id} for user {user_id}")
        return session
    
    @staticmethod
    async def get_session(
        db: AsyncSession,
        session_id: str,
        user_id: str
    ) -> Optional[ChatSession]:
        """
        Get a chat session
        
        Args:
            db: Database session
            session_id: Session ID
            user_id: User ID (for verification)
            
        Returns:
            Chat session if found
        """
        query = select(ChatSession).where(
            and_(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            )
        ).options(
            selectinload(ChatSession.chatbot),
            selectinload(ChatSession.messages)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_sessions(
        db: AsyncSession,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[ChatSession]:
        """
        Get user's chat sessions
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip
            
        Returns:
            List of chat sessions
        """
        query = select(ChatSession).where(
            ChatSession.user_id == user_id
        ).options(
            selectinload(ChatSession.chatbot)
        ).order_by(
            desc(ChatSession.last_activity)
        ).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def add_message(
        db: AsyncSession,
        session_id: str,
        role: MessageRole,
        content: str,
        message_type: MessageType = MessageType.MESSAGE,
        tool_name: Optional[str] = None,
        tool_arguments: Optional[Dict[str, Any]] = None,
        tool_output: Optional[Dict[str, Any]] = None
    ) -> ChatMessage:
        """
        Add a message to a chat session
        
        Args:
            db: Database session
            session_id: Session ID
            role: Message role
            content: Message content
            message_type: Type of message
            tool_name: Optional tool name
            tool_arguments: Optional tool arguments
            tool_output: Optional tool output
            
        Returns:
            Created message
        """
        # Get session to ensure it exists and update counts
        session = await db.get(ChatSession, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Create message
        message = ChatMessage(
            session_id=session_id,
            role=role,
            message_type=message_type,
            content=[{
                "type": "input_text" if role == MessageRole.USER else "output_text",
                "text": content
            }],
            raw_content=content,
            tool_name=tool_name,
            tool_arguments=tool_arguments,
            tool_output=tool_output
        )
        
        # Update session
        session.message_count += 1
        session.last_activity = datetime.now(timezone.utc)
        session.updated_at = datetime.now(timezone.utc)
        
        db.add(message)
        await db.commit()
        await db.refresh(message)
        
        logger.info(f"Added message {message.id} to session {session_id}")
        return message
    
    @staticmethod
    async def get_session_messages(
        db: AsyncSession,
        session_id: str,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[ChatMessage]:
        """
        Get messages for a session
        
        Args:
            db: Database session
            session_id: Session ID
            limit: Maximum number of messages
            offset: Number of messages to skip
            
        Returns:
            List of messages
        """
        query = select(ChatMessage).where(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at)
        
        if limit:
            query = query.limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def delete_session(
        db: AsyncSession,
        session_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a chat session
        
        Args:
            db: Database session
            session_id: Session ID
            user_id: User ID (for verification)
            
        Returns:
            True if deleted, False if not found
        """
        session = await ChatService.get_session(db, session_id, user_id)
        if session:
            await db.delete(session)
            await db.commit()
            logger.info(f"Deleted session {session_id}")
            return True
        return False
    
    @staticmethod
    async def cleanup_empty_sessions(
        db: AsyncSession
    ) -> int:
        """
        Delete sessions with no messages (empty sessions)
        
        Args:
            db: Database session
            
        Returns:
            Number of deleted sessions
        """
        # Find sessions with no messages
        subquery = select(ChatMessage.session_id).distinct()
        
        query = select(ChatSession).where(
            ~ChatSession.id.in_(subquery)
        )
        
        result = await db.execute(query)
        empty_sessions = result.scalars().all()
        
        count = len(empty_sessions)
        for session in empty_sessions:
            await db.delete(session)
        
        await db.commit()
        logger.info(f"Deleted {count} empty sessions")
        return count
    
    @staticmethod
    async def delete_all_user_sessions(
        db: AsyncSession,
        user_id: str
    ) -> int:
        """
        Delete all sessions for a specific user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Number of deleted sessions
        """
        query = select(ChatSession).where(
            ChatSession.user_id == user_id
        )
        
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        count = len(sessions)
        for session in sessions:
            await db.delete(session)
        
        await db.commit()
        logger.info(f"Deleted all {count} sessions for user {user_id}")
        return count
    
    @staticmethod
    async def clear_old_sessions(
        db: AsyncSession,
        days: int = 90
    ) -> int:
        """
        Clear old sessions
        
        Args:
            db: Database session
            days: Number of days to keep sessions
            
        Returns:
            Number of deleted sessions
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        query = select(ChatSession).where(
            ChatSession.last_activity < cutoff_date
        )
        
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        count = len(sessions)
        for session in sessions:
            await db.delete(session)
        
        await db.commit()
        logger.info(f"Deleted {count} old sessions")
        return count
    
    @staticmethod
    async def export_session(
        db: AsyncSession,
        session_id: str,
        user_id: str,
        format: str = "json"
    ) -> Dict[str, Any]:
        """
        Export a chat session
        
        Args:
            db: Database session
            session_id: Session ID
            user_id: User ID
            format: Export format (json, markdown)
            
        Returns:
            Exported session data
        """
        session = await ChatService.get_session(db, session_id, user_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        messages = await ChatService.get_session_messages(db, session_id)
        
        if format == "markdown":
            # Convert to markdown format
            markdown = f"# Chat Session: {session.name}\n\n"
            markdown += f"**Date**: {session.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            markdown += f"**Chatbot**: {session.chatbot.name}\n\n"
            markdown += "---\n\n"
            
            for msg in messages:
                role = msg.role.value.capitalize()
                content = msg.raw_content or ""
                markdown += f"**{role}**: {content}\n\n"
            
            return {"format": "markdown", "content": markdown}
        
        else:
            # Default to JSON
            return {
                "format": "json",
                "session": session.to_dict(),
                "chatbot": session.chatbot.to_dict(),
                "messages": [msg.to_dict() for msg in messages]
            }