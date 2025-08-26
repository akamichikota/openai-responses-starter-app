import { Chatbot } from "@/types/chatbot";

export const chatbots: Chatbot[] = [
  {
    id: "general",
    title: "AI コンシェルジュ",
    description: "あらゆる質問にお答えする万能アシスタント。日常の疑問から複雑な問題まで、何でもお任せください。",
    icon: "🤖",
    welcomeMessage: "こんにちは！何かお手伝いできることはありますか？",
    gradientFrom: "#667eea",
    gradientTo: "#764ba2",
    category: "汎用",
    tags: ["質問応答", "サポート", "万能"],
    featured: true
  },
  {
    id: "creative",
    title: "クリエイティブ・ライター",
    description: "小説、詩、脚本、ブログ記事まで。あなたの創造力を最大限に引き出すクリエイティブパートナー。",
    icon: "✨",
    welcomeMessage: "創作のお手伝いをします！どんなアイデアをお持ちですか？",
    gradientFrom: "#f093fb",
    gradientTo: "#f5576c",
    category: "クリエイティブ",
    tags: ["執筆", "創作", "アイデア"],
    featured: true
  },
  {
    id: "coding",
    title: "コードマスター",
    description: "プログラミングのエキスパート。バグ修正、コードレビュー、アーキテクチャ設計まで完全サポート。",
    icon: "👨‍💻",
    welcomeMessage: "プログラミングでお困りですか？コードの問題を一緒に解決しましょう！",
    gradientFrom: "#4facfe",
    gradientTo: "#00f2fe",
    category: "技術",
    tags: ["プログラミング", "バグ修正", "技術相談"],
    featured: true
  },
  {
    id: "business",
    title: "ビジネスストラテジスト",
    description: "戦略立案、市場分析、プレゼン資料作成。あなたのビジネスを次のレベルへ導きます。",
    icon: "📈",
    welcomeMessage: "ビジネスに関するご相談をお聞かせください。戦略立案をサポートします！",
    gradientFrom: "#fa709a",
    gradientTo: "#fee140",
    category: "ビジネス",
    tags: ["戦略", "分析", "コンサルティング"]
  },
  {
    id: "language",
    title: "ランゲージコーチ",
    description: "多言語学習のスペシャリスト。会話練習から文法説明まで、楽しく効率的な学習をサポート。",
    icon: "🗣️",
    welcomeMessage: "どの言語を学習されますか？一緒に練習しましょう！",
    gradientFrom: "#a8edea",
    gradientTo: "#fed6e3",
    category: "教育",
    tags: ["語学", "学習", "会話練習"]
  },
  {
    id: "health",
    title: "ウェルネスアドバイザー",
    description: "健康管理、栄養相談、フィットネスプランニング。あなたの健康な生活をトータルサポート。",
    icon: "🏃‍♀️",
    welcomeMessage: "健康的な生活をサポートします！どんなことを知りたいですか？",
    gradientFrom: "#96fbc4",
    gradientTo: "#f9f047",
    category: "健康",
    tags: ["健康", "栄養", "フィットネス"]
  },
  {
    id: "finance",
    title: "ファイナンシャルガイド",
    description: "投資アドバイス、家計管理、資産運用の相談。お金の悩みを解決し、豊かな未来を築きましょう。",
    icon: "💰",
    welcomeMessage: "お金に関するご相談をお聞きします。どのようなことでお困りですか？",
    gradientFrom: "#ffecd2",
    gradientTo: "#fcb69f",
    category: "金融",
    tags: ["投資", "家計", "資産運用"]
  },
  {
    id: "education",
    title: "学習メンター",
    description: "あらゆる分野の学習をサポート。数学、科学、歴史から最新技術まで、わかりやすく説明します。",
    icon: "🎓",
    welcomeMessage: "何を学びたいですか？一緒に知識の世界を探検しましょう！",
    gradientFrom: "#a18cd1",
    gradientTo: "#fbc2eb",
    category: "教育",
    tags: ["学習", "教育", "知識"]
  }
];