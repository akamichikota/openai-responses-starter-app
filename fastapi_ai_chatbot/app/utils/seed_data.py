"""
Seed initial data for the application
"""

import logging
from sqlalchemy import select
from app.core.database import get_db_context
from app.models.chatbot import Chatbot

logger = logging.getLogger(__name__)


async def seed_initial_chatbots():
    """Seed initial chatbots if database is empty"""
    try:
        async with get_db_context() as db:
            # Check if chatbots already exist
            query = select(Chatbot).limit(1)
            result = await db.execute(query)
            if result.scalar_one_or_none():
                logger.info("Chatbots already exist, skipping seed")
                return
            
            # Create initial chatbots
            chatbots = [
                Chatbot(
                    name="General Assistant",
                    slug="general-assistant",
                    description="多目的AIアシスタント。質問への回答、文章作成、アイデア出しなど幅広くサポートします。",
                    category="general",
                    model="gpt-4o",
                    system_prompt="""あなたは親切で知識豊富なAIアシスタントです。
ユーザーの質問に対して、正確で役立つ情報を提供します。
必要に応じて、例や説明を含めて回答してください。
日本語で自然な会話を心がけてください。""",
                    welcome_message="こんにちは！何かお手伝いできることはありますか？",
                    suggested_prompts=[
                        "今日の天気を教えて",
                        "簡単なレシピを教えて",
                        "プログラミングの質問があります"
                    ],
                    theme_color="#667eea",
                    is_featured=True,
                    tools_enabled=["web_search"],
                    tags=["general", "assistant", "日本語"]
                ),
                Chatbot(
                    name="Code Expert",
                    slug="code-expert",
                    description="プログラミングとソフトウェア開発の専門家。コードレビュー、デバッグ、最適化をサポート。",
                    category="programming",
                    model="gpt-4o",
                    system_prompt="""You are an expert programmer and software architect.
Help users with coding questions, debugging, code reviews, and best practices.
Provide clear explanations and working code examples.
Support multiple programming languages and frameworks.""",
                    welcome_message="Hello! I'm here to help with your programming questions. What language or framework are you working with?",
                    suggested_prompts=[
                        "Review my Python code",
                        "Explain async/await in JavaScript",
                        "Help me debug this error"
                    ],
                    theme_color="#10b981",
                    is_featured=True,
                    tools_enabled=["code_interpreter", "web_search"],
                    tags=["programming", "code", "development"]
                ),
                Chatbot(
                    name="Creative Writer",
                    slug="creative-writer",
                    description="創造的な文章作成をサポート。小説、詩、ブログ記事、マーケティングコピーなど。",
                    category="writing",
                    model="gpt-4o",
                    system_prompt="""あなたは創造的な文章作成の専門家です。
小説、詩、エッセイ、ブログ記事、マーケティングコピーなど、様々なスタイルの文章を作成します。
ユーザーの要望に応じて、適切なトーンとスタイルで執筆してください。
創造性と独自性を重視しながら、読者を引きつける文章を心がけてください。""",
                    welcome_message="創造的な文章作成をお手伝いします。どんな文章を書きたいですか？",
                    suggested_prompts=[
                        "ブログ記事のアイデアを出して",
                        "短編小説の冒頭を書いて",
                        "商品説明文を作成して"
                    ],
                    theme_color="#f59e0b",
                    is_featured=False,
                    tools_enabled=[],
                    tags=["writing", "creative", "日本語"]
                ),
                Chatbot(
                    name="Data Analyst",
                    slug="data-analyst",
                    description="データ分析と可視化の専門家。統計解析、機械学習、ビジネスインサイトを提供。",
                    category="data",
                    model="gpt-4o",
                    system_prompt="""You are a data analysis and machine learning expert.
Help users with data analysis, statistics, visualization, and machine learning tasks.
Provide clear explanations of statistical concepts and practical implementation advice.
Suggest appropriate tools and libraries for different tasks.""",
                    welcome_message="I can help you analyze data and extract insights. What kind of data are you working with?",
                    suggested_prompts=[
                        "Explain linear regression",
                        "How to visualize time series data",
                        "Best practices for data cleaning"
                    ],
                    theme_color="#8b5cf6",
                    is_featured=False,
                    tools_enabled=["code_interpreter"],
                    tags=["data", "analytics", "ml"]
                ),
                Chatbot(
                    name="Language Tutor",
                    slug="language-tutor",
                    description="言語学習をサポート。文法説明、会話練習、翻訳、発音指導など。",
                    category="education",
                    model="gpt-4o",
                    system_prompt="""あなたは経験豊富な言語教師です。
ユーザーの言語学習をサポートし、文法、語彙、発音、会話練習を提供します。
間違いは優しく訂正し、学習者のレベルに合わせて説明してください。
複数の言語に対応し、効果的な学習方法もアドバイスしてください。""",
                    welcome_message="言語学習のお手伝いをします。どの言語を学んでいますか？",
                    suggested_prompts=[
                        "英語の文法を説明して",
                        "日常会話フレーズを教えて",
                        "この文章を翻訳して"
                    ],
                    theme_color="#ec4899",
                    is_featured=False,
                    tools_enabled=[],
                    tags=["education", "language", "日本語"]
                ),
                Chatbot(
                    name="Business Advisor",
                    slug="business-advisor",
                    description="ビジネス戦略とマネジメントのアドバイザー。起業、マーケティング、財務計画をサポート。",
                    category="business",
                    model="gpt-4o",
                    system_prompt="""You are an experienced business consultant and strategist.
Provide advice on business strategy, marketing, finance, operations, and management.
Help with business planning, market analysis, and problem-solving.
Offer practical, actionable insights based on best practices.""",
                    welcome_message="I'm here to help with your business challenges. What aspect of your business would you like to discuss?",
                    suggested_prompts=[
                        "Create a marketing strategy",
                        "Analyze my business model",
                        "Tips for team management"
                    ],
                    theme_color="#06b6d4",
                    is_featured=False,
                    tools_enabled=["web_search"],
                    tags=["business", "strategy", "consulting"]
                )
            ]
            
            # Add all chatbots
            for chatbot in chatbots:
                db.add(chatbot)
            
            await db.commit()
            logger.info(f"Seeded {len(chatbots)} initial chatbots")
            
    except Exception as e:
        logger.error(f"Error seeding chatbots: {str(e)}")