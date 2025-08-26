"""
OpenAI Integration Service with Streaming Support
"""

import json
import asyncio
import logging
from typing import AsyncGenerator, List, Dict, Any, Optional
from datetime import datetime
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
import time

from app.core.config import settings
from app.models.chat import ChatMessage, MessageRole, MessageType
from app.models.chatbot import Chatbot

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for OpenAI API integration"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
    async def stream_chat(
        self,
        messages: List[ChatMessage],
        chatbot: Chatbot,
        session_id: str,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat responses from OpenAI
        
        Args:
            messages: List of chat messages
            chatbot: Chatbot configuration
            session_id: Current session ID
            tools: Optional list of tools/functions
            
        Yields:
            SSE formatted events
        """
        try:
            # Convert messages to OpenAI format
            formatted_messages = self._format_messages(messages, chatbot)
            
            # Log the request for debugging
            logger.info(f"Streaming chat for session {session_id} with {len(formatted_messages)} messages")
            
            # Create chat completion with streaming
            stream = await self.client.chat.completions.create(
                model=chatbot.model or settings.OPENAI_MODEL,
                messages=formatted_messages,
                temperature=chatbot.temperature or settings.OPENAI_TEMPERATURE,
                max_tokens=chatbot.max_tokens or settings.OPENAI_MAX_TOKENS,
                top_p=chatbot.top_p or 1.0,
                frequency_penalty=chatbot.frequency_penalty or 0.0,
                presence_penalty=chatbot.presence_penalty or 0.0,
                stream=True,
                tools=tools if tools and chatbot.tools_enabled else None,
            )
            
            # Process stream events
            current_message = ""
            current_tool_calls = {}
            message_id = f"msg_{int(time.time() * 1000)}"
            
            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                
                if not delta:
                    continue
                
                # Handle content streaming
                if delta.content:
                    current_message += delta.content
                    yield {
                        "event": "response.output_text.delta",
                        "data": {
                            "delta": delta.content,
                            "item_id": message_id,
                            "text": current_message
                        }
                    }
                
                # Handle tool calls
                if delta.tool_calls:
                    for tool_call in delta.tool_calls:
                        tool_id = tool_call.id or f"tool_{int(time.time() * 1000)}"
                        
                        if tool_id not in current_tool_calls:
                            current_tool_calls[tool_id] = {
                                "id": tool_id,
                                "name": tool_call.function.name if tool_call.function else None,
                                "arguments": ""
                            }
                            
                            # Notify about new tool call
                            yield {
                                "event": "response.output_item.added",
                                "data": {
                                    "item": {
                                        "id": tool_id,
                                        "type": "function_call",
                                        "name": tool_call.function.name if tool_call.function else None,
                                        "arguments": "",
                                        "status": "in_progress"
                                    }
                                }
                            }
                        
                        # Stream tool arguments
                        if tool_call.function and tool_call.function.arguments:
                            current_tool_calls[tool_id]["arguments"] += tool_call.function.arguments
                            yield {
                                "event": "response.function_call_arguments.delta",
                                "data": {
                                    "delta": tool_call.function.arguments,
                                    "item_id": tool_id
                                }
                            }
                
                # Check for finish reason
                if chunk.choices and chunk.choices[0].finish_reason:
                    finish_reason = chunk.choices[0].finish_reason
                    
                    # Complete message if we have content
                    if current_message:
                        yield {
                            "event": "response.output_item.done",
                            "data": {
                                "item": {
                                    "id": message_id,
                                    "type": "message",
                                    "role": "assistant",
                                    "content": [{
                                        "type": "output_text",
                                        "text": current_message
                                    }]
                                }
                            }
                        }
                    
                    # Complete tool calls
                    for tool_id, tool_data in current_tool_calls.items():
                        yield {
                            "event": "response.function_call_arguments.done",
                            "data": {
                                "item_id": tool_id,
                                "arguments": tool_data["arguments"]
                            }
                        }
                        
                        yield {
                            "event": "response.output_item.done",
                            "data": {
                                "item": {
                                    "id": tool_id,
                                    "type": "function_call",
                                    "name": tool_data["name"],
                                    "arguments": tool_data["arguments"],
                                    "status": "completed"
                                }
                            }
                        }
            
            # Send completion event
            yield {
                "event": "response.completed",
                "data": {
                    "response": {
                        "id": session_id,
                        "status": "completed",
                        "output": []
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in stream_chat: {str(e)}")
            yield {
                "event": "error",
                "data": {
                    "message": str(e),
                    "type": "streaming_error"
                }
            }
    
    def _format_messages(self, messages: List[ChatMessage], chatbot: Chatbot) -> List[ChatCompletionMessageParam]:
        """
        Format messages for OpenAI API
        
        Args:
            messages: List of chat messages
            chatbot: Chatbot configuration
            
        Returns:
            Formatted messages for OpenAI API
        """
        formatted = []
        
        # Add system prompt
        if chatbot.system_prompt:
            formatted.append({
                "role": "system",
                "content": chatbot.system_prompt
            })
        
        # Add conversation messages
        for msg in messages:
            openai_msg = msg.to_openai_format()
            if openai_msg:
                formatted.append(openai_msg)
        
        return formatted
    
    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a tool/function call
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments
            
        Returns:
            Tool execution result
        """
        # This is a placeholder - implement actual tool execution
        # You can integrate with external APIs, databases, etc.
        
        logger.info(f"Executing tool: {tool_name} with arguments: {arguments}")
        
        # Example tools
        if tool_name == "get_weather":
            # Simulate weather API call
            location = arguments.get("location", "Tokyo")
            return {
                "location": location,
                "temperature": 22,
                "conditions": "Partly cloudy",
                "humidity": 65
            }
        
        elif tool_name == "web_search":
            # Simulate web search
            query = arguments.get("query", "")
            return {
                "query": query,
                "results": [
                    {"title": "Result 1", "url": "https://example.com/1", "snippet": "Sample result"},
                    {"title": "Result 2", "url": "https://example.com/2", "snippet": "Another result"}
                ]
            }
        
        else:
            return {
                "error": f"Unknown tool: {tool_name}"
            }
    
    async def count_tokens(self, text: str, model: str = None) -> int:
        """
        Count tokens in text
        
        Args:
            text: Text to count tokens for
            model: Model to use for tokenization
            
        Returns:
            Token count
        """
        # Rough estimation - in production, use tiktoken library
        return len(text.split()) * 1.3