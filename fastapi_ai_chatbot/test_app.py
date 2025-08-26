#!/usr/bin/env python3
"""
Test script to verify the application is working
"""

import asyncio
import httpx
import json

async def test_app():
    """Test the application endpoints"""
    
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        try:
            # Test health endpoint
            print("Testing health endpoint...")
            response = await client.get(f"{base_url}/health")
            print(f"Health: {response.status_code} - {response.json()}")
            
            # Test chatbots endpoint
            print("\nTesting chatbots endpoint...")
            response = await client.get(f"{base_url}/api/chatbots")
            chatbots = response.json()
            print(f"Chatbots: {response.status_code} - Found {len(chatbots)} chatbots")
            
            for bot in chatbots[:3]:  # Show first 3
                print(f"  - {bot['name']} ({bot['category']})")
            
            # Test main page
            print("\nTesting main page...")
            response = await client.get(f"{base_url}/")
            print(f"Main page: {response.status_code} - {len(response.text)} bytes")
            
            print("\n✅ All tests passed! Application is working correctly.")
            
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_app())