export interface Chatbot {
  id: string;
  title: string;
  description: string;
  icon: string;
  welcomeMessage: string;
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  category: string;
  tags: string[];
  featured?: boolean;
}