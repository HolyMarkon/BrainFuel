export interface BrainCard {
  id: string;
  question: string;
  answer: string;
  score: number;
  createdAt: Date;
  lastAnswered?: Date;
}

export interface QuizResult {
  isCorrect: boolean;
  cardIndex: number;
}

export type Theme = 'light' | 'dark';
