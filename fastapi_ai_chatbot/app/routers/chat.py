"""
Chat API routes with SSE streaming
"""

import json
import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from sse_starlette import EventSourceResponse

from app.core.database import get_db
from app.services.openai_service import OpenAIService
from app.services.chat_service import ChatService
from app.models.chat import MessageRole, MessageType
from app.models.chatbot import Chatbot
from app.models.user import User
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# Request/Response models
class ChatRequest(BaseModel):
    """Chat request model"""
    session_id: str
    message: str
    tools: Optional[List[Dict[str, Any]]] = None


class CreateSessionRequest(BaseModel):
    """Create session request model"""
    chatbot_id: str
    name: Optional[str] = None


class SessionResponse(BaseModel):
    """Session response model"""
    id: str
    name: str
    chatbot_id: str
    message_count: int
    created_at: str
    last_activity: str


# Global user for simplicity - in production use proper auth
ANONYMOUS_USER_ID = "anonymous_user_001"

# Dependency to get or create anonymous user
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get or create anonymous user from session"""
    # For simplicity, we'll use a single anonymous user
    # In production, implement proper authentication
    
    user_id = ANONYMOUS_USER_ID
    
    # Get or create user
    user = await db.get(User, user_id)
    if not user:
        user = User(
            id=user_id,
            is_anonymous=True,
            username="anonymous_user"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Created anonymous user {user_id}")
    
    return user


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Stream chat responses using Server-Sent Events
    
    This endpoint handles the main chat functionality with streaming responses
    """
    try:
        logger.info(f"Looking for session {request.session_id} for user {user.id}")
        # Get session with messages
        session = await ChatService.get_session(db, request.session_id, user.id)
        if not session:
            logger.error(f"Session {request.session_id} not found for user {user.id}")
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get chatbot configuration
        chatbot = await db.get(Chatbot, session.chatbot_id)
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        
        # Add user message
        user_message = await ChatService.add_message(
            db,
            session_id=request.session_id,
            role=MessageRole.USER,
            content=request.message,
            message_type=MessageType.MESSAGE
        )
        
        # Get all session messages for context
        messages = await ChatService.get_session_messages(db, request.session_id)
        
        # Create OpenAI service
        openai_service = OpenAIService()
        
        async def generate():
            """Generate SSE events"""
            try:
                # Stream from OpenAI
                async for event in openai_service.stream_chat(
                    messages=messages,
                    chatbot=chatbot,
                    session_id=request.session_id,
                    tools=request.tools
                ):
                    # Format as SSE
                    sse_data = json.dumps(event)
                    yield f"data: {sse_data}\n\n"
                    
                    # Save assistant message when complete
                    if event.get("event") == "response.output_item.done":
                        item = event.get("data", {}).get("item", {})
                        if item.get("type") == "message" and item.get("role") == "assistant":
                            content_text = ""
                            for content_item in item.get("content", []):
                                if content_item.get("type") == "output_text":
                                    content_text = content_item.get("text", "")
                                    break
                            
                            if content_text:
                                await ChatService.add_message(
                                    db,
                                    session_id=request.session_id,
                                    role=MessageRole.ASSISTANT,
                                    content=content_text,
                                    message_type=MessageType.MESSAGE
                                )
                
                # Send done signal
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                logger.error(f"Error in stream generation: {str(e)}")
                error_event = {
                    "event": "error",
                    "data": {"message": str(e)}
                }
                sse_error_data = json.dumps(error_event)
                yield f"data: {sse_error_data}\n\n"
        
        return EventSourceResponse(generate())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in stream_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions")
async def create_session(
    request: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> SessionResponse:
    """Create a new chat session"""
    try:
        session = await ChatService.create_session(
            db,
            user_id=user.id,
            chatbot_id=request.chatbot_id,
            name=request.name
        )
        
        return SessionResponse(
            id=session.id,
            name=session.name or "",
            chatbot_id=session.chatbot_id,
            message_count=session.message_count,
            created_at=session.created_at.isoformat(),
            last_activity=session.last_activity.isoformat()
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions")
async def get_sessions(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> List[SessionResponse]:
    """Get user's chat sessions"""
    try:
        sessions = await ChatService.get_user_sessions(
            db,
            user_id=user.id,
            limit=limit,
            offset=offset
        )
        
        return [
            SessionResponse(
                id=session.id,
                name=session.name or "",
                chatbot_id=session.chatbot_id,
                message_count=session.message_count,
                created_at=session.created_at.isoformat(),
                last_activity=session.last_activity.isoformat()
            )
            for session in sessions
        ]
        
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get sessions")


@router.delete("/sessions/bulk-delete")
async def bulk_delete_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete all sessions for the current user"""
    try:
        count = await ChatService.delete_all_user_sessions(db, user.id)
        return {"message": f"Deleted {count} sessions"}
        
    except Exception as e:
        logger.error(f"Error bulk deleting sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to bulk delete sessions")


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get session details with messages"""
    try:
        session = await ChatService.get_session(db, session_id, user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = await ChatService.get_session_messages(db, session_id)
        
        return {
            "session": session.to_dict(),
            "chatbot": session.chatbot.to_dict() if session.chatbot else None,
            "messages": [msg.to_dict() for msg in messages]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get session")


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Delete a chat session"""
    try:
        deleted = await ChatService.delete_session(db, session_id, user.id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete session")


@router.get("/sessions/{session_id}/export")
async def export_session(
    session_id: str,
    format: str = Query("json", regex="^(json|markdown)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Export session in specified format"""
    try:
        export_data = await ChatService.export_session(
            db,
            session_id=session_id,
            user_id=user.id,
            format=format
        )
        
        return export_data
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export session")


@router.delete("/sessions/cleanup-empty")
async def cleanup_empty_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete all empty sessions (sessions with no messages)"""
    try:
        count = await ChatService.cleanup_empty_sessions(db)
        return {"message": f"Deleted {count} empty sessions"}
        
    except Exception as e:
        logger.error(f"Error cleaning up empty sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cleanup empty sessions")