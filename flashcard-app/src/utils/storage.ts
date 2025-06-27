import type { Flashcard, Theme } from '../types';

const FLASHCARDS_KEY = 'flashcards';
const THEME_KEY = 'theme';

export const saveFlashcards = (flashcards: Flashcard[]): void => {
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(flashcards));
};

export const loadFlashcards = (): Flashcard[] => {
  const stored = localStorage.getItem(FLASHCARDS_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((card: any) => ({
      ...card,
      createdAt: new Date(card.createdAt),
      lastAnswered: card.lastAnswered ? new Date(card.lastAnswered) : undefined,
    }));
  } catch {
    return [];
  }
};

export const saveTheme = (theme: Theme): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const loadTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_KEY);
  return (stored as Theme) || 'light';
};
