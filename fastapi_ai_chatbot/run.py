#!/usr/bin/env python3
"""
Run the FastAPI AI Chatbot application
"""

import os
import sys
import asyncio
import uvicorn
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

def main():
    """Main entry point"""
    print("\n" + "="*60)
    print("🤖 AI Chat Platform - FastAPI Edition")
    print("="*60)
    
    # Check for .env file
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        print("\n⚠️  Warning: .env file not found!")
        print("Creating .env from .env.example...")
        
        example_path = Path(__file__).parent / ".env.example"
        if example_path.exists():
            import shutil
            shutil.copy(example_path, env_path)
            print("✅ .env file created. Please update OPENAI_API_KEY!")
        else:
            print("❌ .env.example not found. Please create .env manually.")
    
    # Check for OpenAI API key
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("\n⚠️  Warning: OpenAI API key not configured!")
        print("Please set OPENAI_API_KEY in .env file")
        print("\nYou can get your API key from: https://platform.openai.com/api-keys")
        
        response = input("\nDo you want to enter your API key now? (y/n): ")
        if response.lower() == 'y':
            api_key = input("Enter your OpenAI API key: ").strip()
            if api_key:
                # Update .env file
                with open(env_path, 'r') as f:
                    lines = f.readlines()
                
                with open(env_path, 'w') as f:
                    for line in lines:
                        if line.startswith("OPENAI_API_KEY"):
                            f.write(f"OPENAI_API_KEY={api_key}\n")
                        else:
                            f.write(line)
                
                print("✅ API key saved to .env file")
                os.environ["OPENAI_API_KEY"] = api_key
            else:
                print("❌ No API key provided. The app may not function properly.")
    
    # Import app after loading environment
    from app.main import app
    from app.core.config import settings
    
    print(f"\n🚀 Starting server...")
    print(f"📍 URL: http://localhost:{settings.APP_PORT}")
    print(f"📚 API Docs: http://localhost:{settings.APP_PORT}/docs")
    print(f"🔄 Auto-reload: {'Enabled' if settings.APP_RELOAD else 'Disabled'}")
    print("\n💡 Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    # Run the application
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_RELOAD,
        log_level="info"
    )

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)