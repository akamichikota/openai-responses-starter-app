"""
Seed initial data for the application
"""

import logging
from sqlalchemy import select
from app.core.database import get_db_context
from app.models.chatbot import Chatbot

logger = logging.getLogger(__name__)


async def seed_initial_chatbots():
    """Seed initial chatbots (will recreate if they exist)"""
    try:
        async with get_db_context() as db:
            # Delete all existing chatbots
            existing_chatbots = await db.execute(select(Chatbot))
            for chatbot in existing_chatbots.scalars().all():
                await db.delete(chatbot)
            await db.commit()
            logger.info("Cleared existing chatbots")
            
            # Create initial chatbots
            chatbots = [
                Chatbot(
                    name="汎用アシスタント",
                    slug="general-assistant",
                    description="日常的な質問、調べ物、相談など幅広いトピックについて自然な日本語でサポートします。",
                    category="general",
                    model="gpt-4o",
                    system_prompt="""あなたは親切で知識豊富なAIアシスタントです。
ユーザーの様々な質問に対して、正確で分かりやすい情報を提供します。
日本語で自然な会話を心がけ、必要に応じて具体例や詳細な説明を含めて回答してください。
ユーザーの立場に立って、親身になってサポートしてください。""",
                    suggested_prompts=[
                        "今日のニュースについて教えて",
                        "健康的な食事のアドバイスをください",
                        "仕事の効率を上げる方法は？",
                        "おすすめの本を教えて"
                    ],
                    theme_color="#667eea",
                    is_featured=True,
                    tools_enabled=["web_search"],
                    tags=["general", "日本語", "相談"]
                ),
                Chatbot(
                    name="小説執筆アシスタント",
                    slug="novel-writer",
                    description="小説やストーリー創作をサポート。プロット作成、キャラクター設定、文章表現など創作活動全般をお手伝いします。",
                    category="creative",
                    model="gpt-4o",
                    system_prompt="""あなたは経験豊富な小説家・創作指導者です。
ユーザーの創作活動を全面的にサポートし、以下の分野で専門的なアドバイスを提供してください：

・プロット構成と物語構造の設計
・魅力的なキャラクター作成と心理描写
・場面設定と世界観の構築  
・文章表現技法と文体の向上
・ジャンル別の執筆技術（ミステリー、恋愛、SF、ファンタジーなど）

創造性を重視し、読者を引きつける作品作りを目指してください。
具体的な例やテクニックを交えながら、実践的な指導を心がけてください。""",
                    suggested_prompts=[
                        "魅力的な主人公の作り方を教えて",
                        "ミステリー小説のトリックアイデア",
                        "恋愛シーンの自然な書き方",
                        "読者を引きつける冒頭の書き方"
                    ],
                    theme_color="#f59e0b",
                    is_featured=True,
                    tools_enabled=[],
                    tags=["creative", "writing", "novel", "日本語"]
                ),
                Chatbot(
                    name="学習チューター",
                    slug="learning-tutor",
                    description="新しい知識を体系的に学習できるよう、会話形式で分かりやすく教えてくれる個人指導者です。",
                    category="education",
                    model="gpt-4o",
                    system_prompt="""あなたは優秀な個人指導教師です。
ユーザーが新しい分野の知識を効率的に習得できるよう、以下の教育方針でサポートしてください：

・基礎から応用まで体系的なカリキュラムを提示
・会話形式での双方向の学習進行
・理解度に応じたペース調整と復習提案
・具体例や実践的な応用例を豊富に提供
・定期的な理解度チェックと弱点補強
・学習者のモチベーション維持

難しい概念も分かりやすく説明し、学習者が「なるほど！」と納得できる指導を心がけてください。
質問を積極的に投げかけ、能動的な学習を促進してください。""",
                    suggested_prompts=[
                        "プログラミングを基礎から学びたい",
                        "経済学の基本概念を教えて",
                        "統計学を実践的に学びたい",
                        "歴史を体系的に理解したい"
                    ],
                    theme_color="#10b981",
                    is_featured=True,
                    tools_enabled=["web_search"],
                    tags=["education", "learning", "tutorial", "日本語"]
                )
            ]
            
            # Add all chatbots
            for chatbot in chatbots:
                db.add(chatbot)
            
            await db.commit()
            logger.info(f"Seeded {len(chatbots)} initial chatbots")
            
    except Exception as e:
        logger.error(f"Error seeding chatbots: {str(e)}")