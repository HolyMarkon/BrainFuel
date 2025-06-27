import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import AuthPage from './AuthPage';

interface BrainCard {
  id: string;
  question: string;
  answer: string;
  score: number;
  category: string;
  image?: string;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface SessionStats {
  date: Date;
  totalAnswered: number;
  correctAnswers: number;
  accuracy: number;
  cardsImproved: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'mastery' | 'streak' | 'special';
  requirement: {
    type: 'totalAnswered' | 'correctAnswers' | 'cardsLearned' | 'cardsMastered' | 'level' | 'accuracy' | 'streakDays' | 'special';
    value: number;
    description: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface User {
  id: string;
  username: string;
  email: string;
  password: string; // In real app, this would be hashed
  nickname: string; // Display name/nickname
  createdAt: Date;
  lastLogin: Date;
  lastActivity: Date;
  // Progress tracking for avatar evolution
  totalAnswered: number;
  correctAnswers: number;
  cardsLearned: number; // Cards with score >= 1
  cardsMastered: number; // Cards with score >= 2
  streakDays: number;
  level: number;
  // Dashboard data
  totalCards: number;
  cardsToReview: number; // Cards that need practice
  studyStreak: number; // Days in a row of studying
  totalStudyTime: number; // Minutes spent studying
  weeklyGoal: number; // Cards to study per week
  weeklyProgress: number; // Cards studied this week
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cards' | 'practice' | 'stats' | 'achievements' | 'settings'>('dashboard');
  const [braincards, setBraincards] = useState<BrainCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedQuizCategory, setSelectedQuizCategory] = useState('all');
  const [selectedStatsCategory, setSelectedStatsCategory] = useState('all');
  const [currentCardIndex, setCurrentCardIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAnimating, setIsAnimating] = useState(false);
  const [editingCard, setEditingCard] = useState<BrainCard | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');
  const [autoAdvance, setAutoAdvance] = useState(true);

  // New states for advanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | -1 | 0 | 1 | 2>('all');
  const [sessionStats, setSessionStats] = useState<SessionStats[]>([]);
  const [currentSessionAnswers, setCurrentSessionAnswers] = useState(0);
  const [currentSessionCorrect, setCurrentSessionCorrect] = useState(0);

  // Animation and feedback states (removed unused variables)

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Toast notification system
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>>([]);

  // Achievement system
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showAchievementPopup, setShowAchievementPopup] = useState<Achievement | null>(null);

  // Available emoji icons for categories
  const availableIcons = [
    '📚', '🔢', '🧪', '📜', '🗣️', '🌍', '🎨', '🎵', '⚽', '💻',
    '🏛️', '🔬', '📖', '✏️', '🎯', '🧠', '💡', '🌟', '🚀', '🎪',
    '🏆', '📝', '🎲', '🎭', '🎬', '📊', '🔍', '⚖️', '🏥', '🍎'
  ];

  // Progressive avatar system based on user progress using custom brain images
  const getAvatarForLevel = (level: number): string => {
    // We have 5 brain level images (1.png to 5.png)
    // Map levels to available images - fixing the order (2 and 3 were swapped)
    const baseUrl = import.meta.env.BASE_URL || '/';
    if (level === 0) return `${baseUrl}avatars/1.png`; // Starting brain
    if (level <= 2) return `${baseUrl}avatars/3.png`;  // Developing brain (was 2.png)
    if (level <= 4) return `${baseUrl}avatars/2.png`;  // Advanced brain (was 3.png)
    if (level <= 7) return `${baseUrl}avatars/4.png`;  // Expert brain
    return `${baseUrl}avatars/5.png`;                  // Master brain (level 8+)
  };

  const getAvatarDescription = (level: number): string => {
    if (level === 0) return 'Začátečník';
    if (level <= 2) return 'Rozvíjející se mozek';
    if (level <= 4) return 'Pokročilý student';
    if (level <= 7) return 'Expert';
    return 'Mistr učení';
  };

  // Toast notification component
  const ToastContainer: React.FC = () => {
    return (
      <div className="fixed top-4 right-4 left-4 md:left-auto z-50 space-y-3 max-w-md md:w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-slide-in-right backdrop-blur-xl ${
              toast.type === 'success' ? 'border-l-4 border-green-500' :
              toast.type === 'error' ? 'border-l-4 border-red-500' :
              toast.type === 'warning' ? 'border-l-4 border-yellow-500' :
              'border-l-4 border-blue-500'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {toast.type === 'success' && (
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {toast.type === 'error' && (
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  {toast.type === 'warning' && (
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  )}
                  {toast.type === 'info' && (
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-slate-900 dark:text-white leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    className="bg-white dark:bg-slate-800 rounded-lg inline-flex text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 transition-colors duration-200"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Zavřít</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Achievement popup component
  const AchievementPopup: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const rarityColors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-orange-500'
    };

    const rarityBorders = {
      common: 'border-gray-400',
      rare: 'border-blue-400',
      epic: 'border-purple-400',
      legendary: 'border-yellow-400'
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className={`bg-white dark:bg-slate-800 rounded-3xl border-4 ${rarityBorders[achievement.rarity]} shadow-2xl max-w-md w-full animate-bounce-in`}>
          <div className={`bg-gradient-to-r ${rarityColors[achievement.rarity]} p-6 rounded-t-3xl text-center`}>
            <div className="text-6xl mb-2">{achievement.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-1">Úspěch odemčen!</h2>
            <div className="text-white/90 text-sm uppercase tracking-wider font-semibold">
              {achievement.rarity === 'common' && '⚪ Běžný'}
              {achievement.rarity === 'rare' && '🔵 Vzácný'}
              {achievement.rarity === 'epic' && '🟣 Epický'}
              {achievement.rarity === 'legendary' && '🟡 Legendární'}
            </div>
          </div>
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {achievement.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {achievement.description}
            </p>
            <button
              onClick={() => setShowAchievementPopup(null)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300"
            >
              Pokračovat
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Avatar component for consistent display
  const AvatarImage: React.FC<{
    level: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showLevel?: boolean;
    className?: string;
  }> = ({ level, size = 'md', showLevel = false, className = '' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-24 h-24'
    };

    const levelBadgeSize = {
      sm: 'w-4 h-4 text-xs',
      md: 'w-6 h-6 text-xs',
      lg: 'w-8 h-8 text-sm',
      xl: 'w-10 h-10 text-base'
    };

    const avatarSrc = getAvatarForLevel(level);
    console.log(`Avatar for level ${level}: ${avatarSrc}`); // Debug log

    return (
      <div className={`relative ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-slate-700 shadow-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden`}>
          <img
            src={avatarSrc}
            alt={`Avatar level ${level}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error(`Failed to load avatar: ${avatarSrc}`);
              // Fallback to a default image or emoji
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        {showLevel && (
          <div className={`absolute -bottom-1 -right-1 ${levelBadgeSize[size]} bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-white border-2 border-white dark:border-slate-800`}>
            {level}
          </div>
        )}
      </div>
    );
  };

  const calculateUserLevel = (user: User): number => {
    const { totalAnswered, correctAnswers, cardsLearned, cardsMastered } = user;

    let points = 0;

    // Points for answering questions
    points += totalAnswered * 1;

    // Bonus points for correct answers
    points += correctAnswers * 2;

    // Bonus points for learning cards (score >= 1)
    points += cardsLearned * 5;

    // Big bonus for mastering cards (score >= 2)
    points += cardsMastered * 10;

    // Level calculation (exponential growth)
    return Math.floor(Math.sqrt(points / 10));
  };

  const checkForNewAchievements = (oldUser: User, newUser: User) => {
    const oldAchievements = getUnlockedAchievements(oldUser);
    const newAchievements = getUnlockedAchievements(newUser);

    const justUnlocked = newAchievements.filter(achievement =>
      !oldAchievements.some(old => old.id === achievement.id)
    );

    justUnlocked.forEach(achievement => {
      setShowAchievementPopup(achievement);
      showToast(`🏆 Nový úspěch: ${achievement.title}!`, 'success', 6000);

      // Auto-hide achievement popup after 4 seconds
      setTimeout(() => {
        setShowAchievementPopup(null);
      }, 4000);
    });
  };

  const updateUserProgress = (user: User) => {
    const oldUser = { ...currentUser } as User;

    // Update cards learned and mastered
    const cardsLearned = braincards.filter(card => card.score >= 1).length;
    const cardsMastered = braincards.filter(card => card.score >= 2).length;
    const cardsToReview = braincards.filter(card => card.score < 2).length;

    // Create updated user object
    const updatedUser = {
      ...user,
      cardsLearned,
      cardsMastered,
      totalCards: braincards.length,
      cardsToReview,
      lastActivity: new Date(),
      level: calculateUserLevel({...user, cardsLearned, cardsMastered})
    };

    console.log(`User progress updated: Level ${user.level} -> ${updatedUser.level}`); // Debug log

    // Check for new achievements
    if (oldUser) {
      checkForNewAchievements(oldUser, updatedUser);
    }

    // Save updated user
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const getLevelProgress = (user: User): { current: number, next: number, percentage: number } => {
    const currentLevel = user.level;
    const currentPoints = user.totalAnswered + (user.correctAnswers * 2) + (user.cardsLearned * 5) + (user.cardsMastered * 10);
    const currentLevelThreshold = (currentLevel * currentLevel) * 10;
    const nextLevelThreshold = ((currentLevel + 1) * (currentLevel + 1)) * 10;

    const progressInLevel = currentPoints - currentLevelThreshold;
    const pointsNeededForNext = nextLevelThreshold - currentLevelThreshold;
    const percentage = Math.min((progressInLevel / pointsNeededForNext) * 100, 100);

    return {
      current: currentLevelThreshold,
      next: nextLevelThreshold,
      percentage: Math.max(0, percentage)
    };
  };

  // Complete achievement definitions
  const allAchievements: Achievement[] = [
    // Progress Achievements
    { id: 'first_steps', title: 'První kroky', description: 'Odpovězte na 10 otázek', icon: '🎯', category: 'progress', requirement: { type: 'totalAnswered', value: 10, description: '10 odpovědí' }, rarity: 'common' },
    { id: 'getting_started', title: 'Začátečník', description: 'Odpovězte na 25 otázek', icon: '📝', category: 'progress', requirement: { type: 'totalAnswered', value: 25, description: '25 odpovědí' }, rarity: 'common' },
    { id: 'dedicated_student', title: 'Pilný student', description: 'Odpovězte na 50 otázek', icon: '📚', category: 'progress', requirement: { type: 'totalAnswered', value: 50, description: '50 odpovědí' }, rarity: 'common' },
    { id: 'persistent', title: 'Vytrvalý', description: 'Odpovězte na 100 otázek', icon: '💪', category: 'progress', requirement: { type: 'totalAnswered', value: 100, description: '100 odpovědí' }, rarity: 'rare' },
    { id: 'unstoppable', title: 'Neúnavný', description: 'Odpovězte na 250 otázek', icon: '🔥', category: 'progress', requirement: { type: 'totalAnswered', value: 250, description: '250 odpovědí' }, rarity: 'rare' },
    { id: 'marathon_runner', title: 'Maratonec', description: 'Odpovězte na 500 otázek', icon: '🏃‍♂️', category: 'progress', requirement: { type: 'totalAnswered', value: 500, description: '500 odpovědí' }, rarity: 'epic' },
    { id: 'legend', title: 'Legenda', description: 'Odpovězte na 1000 otázek', icon: '👑', category: 'progress', requirement: { type: 'totalAnswered', value: 1000, description: '1000 odpovědí' }, rarity: 'legendary' },

    // Mastery Achievements
    { id: 'accurate_shooter', title: 'Přesný střelec', description: '25 správných odpovědí', icon: '🎯', category: 'mastery', requirement: { type: 'correctAnswers', value: 25, description: '25 správných' }, rarity: 'common' },
    { id: 'sharpshooter', title: 'Ostrostřelec', description: '100 správných odpovědí', icon: '🏹', category: 'mastery', requirement: { type: 'correctAnswers', value: 100, description: '100 správných' }, rarity: 'rare' },
    { id: 'sniper', title: 'Sniper', description: '250 správných odpovědí', icon: '🎯', category: 'mastery', requirement: { type: 'correctAnswers', value: 250, description: '250 správných' }, rarity: 'epic' },
    { id: 'quick_learner', title: 'Rychlý mozek', description: 'Naučte se 10 kartiček', icon: '🧠', category: 'mastery', requirement: { type: 'cardsLearned', value: 10, description: '10 naučených' }, rarity: 'common' },
    { id: 'knowledge_seeker', title: 'Hledač znalostí', description: 'Naučte se 25 kartiček', icon: '🔍', category: 'mastery', requirement: { type: 'cardsLearned', value: 25, description: '25 naučených' }, rarity: 'rare' },
    { id: 'master', title: 'Mistr', description: 'Zvládněte 5 kartiček', icon: '⭐', category: 'mastery', requirement: { type: 'cardsMastered', value: 5, description: '5 zvládnutých' }, rarity: 'rare' },
    { id: 'grandmaster', title: 'Velmistr', description: 'Zvládněte 15 kartiček', icon: '🌟', category: 'mastery', requirement: { type: 'cardsMastered', value: 15, description: '15 zvládnutých' }, rarity: 'epic' },
    { id: 'perfectionist', title: 'Perfekcionista', description: 'Zvládněte 30 kartiček', icon: '💎', category: 'mastery', requirement: { type: 'cardsMastered', value: 30, description: '30 zvládnutých' }, rarity: 'legendary' },

    // Level Achievements
    { id: 'novice', title: 'Nováček', description: 'Dosáhněte Level 1', icon: '🌱', category: 'progress', requirement: { type: 'level', value: 1, description: 'Level 1' }, rarity: 'common' },
    { id: 'advanced', title: 'Pokročilý', description: 'Dosáhněte Level 5', icon: '🚀', category: 'progress', requirement: { type: 'level', value: 5, description: 'Level 5' }, rarity: 'rare' },
    { id: 'expert', title: 'Expert', description: 'Dosáhněte Level 8', icon: '🎓', category: 'progress', requirement: { type: 'level', value: 8, description: 'Level 8' }, rarity: 'epic' },
    { id: 'genius', title: 'Génius', description: 'Dosáhněte Level 12', icon: '🧙‍♂️', category: 'progress', requirement: { type: 'level', value: 12, description: 'Level 12' }, rarity: 'legendary' },

    // Special Achievements
    { id: 'night_owl', title: 'Noční sova', description: 'Učte se po 22:00', icon: '🦉', category: 'special', requirement: { type: 'special', value: 1, description: 'Učení v noci' }, rarity: 'rare' },
    { id: 'early_bird', title: 'Ranní ptáče', description: 'Učte se před 7:00', icon: '🐦', category: 'special', requirement: { type: 'special', value: 2, description: 'Učení ráno' }, rarity: 'rare' },
    { id: 'speed_demon', title: 'Rychlík', description: 'Odpovězte na 10 otázek za minutu', icon: '⚡', category: 'special', requirement: { type: 'special', value: 3, description: 'Rychlé odpovědi' }, rarity: 'epic' },
  ];

  const getUnlockedAchievements = (user: User): Achievement[] => {
    return allAchievements.filter(achievement => {
      switch (achievement.requirement.type) {
        case 'totalAnswered':
          return user.totalAnswered >= achievement.requirement.value;
        case 'correctAnswers':
          return user.correctAnswers >= achievement.requirement.value;
        case 'cardsLearned':
          return user.cardsLearned >= achievement.requirement.value;
        case 'cardsMastered':
          return user.cardsMastered >= achievement.requirement.value;
        case 'level':
          return user.level >= achievement.requirement.value;
        case 'special':
          return unlockedAchievements.includes(achievement.id);
        default:
          return false;
      }
    });
  };

  const getAchievementProgress = (achievement: Achievement, user: User): number => {
    let current = 0;
    switch (achievement.requirement.type) {
      case 'totalAnswered':
        current = user.totalAnswered;
        break;
      case 'correctAnswers':
        current = user.correctAnswers;
        break;
      case 'cardsLearned':
        current = user.cardsLearned;
        break;
      case 'cardsMastered':
        current = user.cardsMastered;
        break;
      case 'level':
        current = user.level;
        break;
      case 'special':
        return unlockedAchievements.includes(achievement.id) ? 100 : 0;
    }
    return Math.min((current / achievement.requirement.value) * 100, 100);
  };

  // Default categories
  const defaultCategories: Category[] = [
    { id: 'math', name: 'Matematika', color: 'from-blue-500 to-cyan-500', icon: '🔢' },
    { id: 'science', name: 'Věda', color: 'from-green-500 to-emerald-500', icon: '🧪' },
    { id: 'history', name: 'Historie', color: 'from-amber-500 to-orange-500', icon: '📜' },
    { id: 'language', name: 'Jazyky', color: 'from-purple-500 to-pink-500', icon: '🗣️' },
    { id: 'geography', name: 'Zeměpis', color: 'from-teal-500 to-blue-500', icon: '🌍' },
    { id: 'other', name: 'Ostatní', color: 'from-slate-500 to-gray-500', icon: '📚' },
  ];

  // Toast notification functions
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000) => {
    const id = Date.now().toString();
    const newToast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    // Clear user-specific data
    setBraincards([]);
    setCategories(defaultCategories);
    setSessionStats([]);
    showToast('Úspěšně jste se odhlásili', 'success');
  };

  const resetToDemo = () => {
    if (confirm('Opravdu chcete obnovit demo účty? Toto smaže všechna současná data!')) {
      // Clear all data
      localStorage.clear();

      // Recreate demo users
      const demoUsers = createDemoUsers();
      setUsers(demoUsers);

      // Save demo users to localStorage immediately
      localStorage.setItem('users', JSON.stringify(demoUsers));

      // Reset other data
      setCurrentUser(null);
      setBraincards([]);
      setCategories(defaultCategories);
      setSessionStats([]);
      setUnlockedAchievements([]);

      showToast('Demo účty byly obnoveny! 🎮', 'success');
    }
  };

  // Create demo users for testing
  const createDemoUsers = (): User[] => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return [
      {
        id: 'demo-beginner',
        username: 'demo_zacatecnik',
        email: 'zacatecnik@demo.cz',
        password: 'demo123',
        nickname: 'Začátečník Demo',
        createdAt: now,
        lastLogin: now,
        lastActivity: now,
        totalAnswered: 5,
        correctAnswers: 3,
        cardsLearned: 2,
        cardsMastered: 0,
        streakDays: 1,
        level: 0,
        totalCards: 8,
        cardsToReview: 6,
        studyStreak: 1,
        totalStudyTime: 15,
        weeklyGoal: 20,
        weeklyProgress: 5
      },
      {
        id: 'demo-intermediate',
        username: 'demo_pokrocily',
        email: 'pokrocily@demo.cz',
        password: 'demo123',
        nickname: 'Pokročilý Demo',
        createdAt: now,
        lastLogin: now,
        lastActivity: yesterday,
        totalAnswered: 75,
        correctAnswers: 60,
        cardsLearned: 15,
        cardsMastered: 8,
        streakDays: 5,
        level: 5,
        totalCards: 25,
        cardsToReview: 10,
        studyStreak: 5,
        totalStudyTime: 180,
        weeklyGoal: 50,
        weeklyProgress: 35
      },
      {
        id: 'demo-expert',
        username: 'demo_expert',
        email: 'expert@demo.cz',
        password: 'demo123',
        nickname: 'Expert Demo',
        createdAt: now,
        lastLogin: now,
        lastActivity: now,
        totalAnswered: 300,
        correctAnswers: 250,
        cardsLearned: 35,
        cardsMastered: 20,
        streakDays: 15,
        level: 8,
        totalCards: 50,
        cardsToReview: 15,
        studyStreak: 15,
        totalStudyTime: 720,
        weeklyGoal: 100,
        weeklyProgress: 85
      }
    ];
  };

  // Load braincards, categories, users and theme from localStorage
  useEffect(() => {
    // Create demo users first
    const demoUsers = createDemoUsers();

    // Load users
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        const loadedUsers = parsed.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastLogin: new Date(user.lastLogin)
        }));

        // Merge demo users with loaded users (demo users take priority)
        const mergedUsers = [...demoUsers];
        loadedUsers.forEach((loadedUser: User) => {
          if (!demoUsers.some(demo => demo.username === loadedUser.username)) {
            mergedUsers.push(loadedUser);
          }
        });

        setUsers(mergedUsers);
        // Save merged users back to localStorage
        localStorage.setItem('users', JSON.stringify(mergedUsers));
      } catch (e) {
        console.error('Error loading users:', e);
        // If loading fails, use demo users
        setUsers(demoUsers);
        localStorage.setItem('users', JSON.stringify(demoUsers));
      }
    } else {
      // If no users exist, use demo users
      setUsers(demoUsers);
      localStorage.setItem('users', JSON.stringify(demoUsers));
    }

    // Load current user
    const savedCurrentUser = localStorage.getItem('currentUser');
    if (savedCurrentUser) {
      try {
        const parsed = JSON.parse(savedCurrentUser);
        setCurrentUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          lastLogin: new Date(parsed.lastLogin),
          lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : new Date(),
          // Initialize new properties for existing users
          totalAnswered: parsed.totalAnswered || 0,
          correctAnswers: parsed.correctAnswers || 0,
          cardsLearned: parsed.cardsLearned || 0,
          cardsMastered: parsed.cardsMastered || 0,
          streakDays: parsed.streakDays || 0,
          level: parsed.level || 0,
          totalCards: parsed.totalCards || 0,
          cardsToReview: parsed.cardsToReview || 0,
          studyStreak: parsed.studyStreak || 0,
          totalStudyTime: parsed.totalStudyTime || 0,
          weeklyGoal: parsed.weeklyGoal || 20,
          weeklyProgress: parsed.weeklyProgress || 0
        });
      } catch (e) {
        console.error('Error loading current user:', e);
      }
    }

    // Load unlocked achievements
    const savedAchievements = localStorage.getItem('unlockedAchievements');
    if (savedAchievements) {
      try {
        setUnlockedAchievements(JSON.parse(savedAchievements));
      } catch (e) {
        console.error('Error loading achievements:', e);
      }
    }

    // Only load user data if user is logged in
    if (savedCurrentUser) {
      const saved = localStorage.getItem('braincards');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBraincards(parsed.map((card: any) => ({
            ...card,
            category: card.category || 'other', // Fallback for old cards
            createdAt: new Date(card.createdAt)
          })));
        } catch (e) {
          console.error('Error loading braincards:', e);
        }
      }

      const savedCategories = localStorage.getItem('categories');
      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories));
        } catch (e) {
          console.error('Error loading categories:', e);
          setCategories(defaultCategories);
        }
      } else {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save braincards to localStorage
  useEffect(() => {
    localStorage.setItem('braincards', JSON.stringify(braincards));
  }, [braincards]);

  // Save categories to localStorage
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Save unlocked achievements to localStorage
  useEffect(() => {
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddBraincard = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && answer.trim() && selectedCategory) {
      const newCard: BrainCard = {
        id: Date.now().toString(),
        question: question.trim(),
        answer: answer.trim(),
        category: selectedCategory,
        score: 0,
        createdAt: new Date(),
      };
      setBraincards(prev => [...prev, newCard]);
      setQuestion('');
      setAnswer('');
      setSelectedCategory('');
      setShowAddCard(false);
      showToast('Kartička byla úspěšně přidána! 📚', 'success');
    }
  };

  const handleDeleteBraincard = (id: string) => {
    setBraincards(prev => prev.filter(card => card.id !== id));
    showToast(`Kartička byla smazána! 🗑️`, 'info');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        color: 'from-indigo-500 to-purple-500',
        icon: newCategoryIcon,
      };
      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName('');
      setNewCategoryIcon('📝');
      setShowAddCategory(false);
      showToast(`Kategorie "${newCategoryName}" byla přidána! ${newCategoryIcon}`, 'success');
    }
  };

  const handleEditCard = (card: BrainCard) => {
    setEditingCard(card);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setEditCategory(card.category);
  };

  const handleUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCard && editQuestion.trim() && editAnswer.trim() && editCategory) {
      setBraincards(prev => prev.map(card =>
        card.id === editingCard.id
          ? { ...card, question: editQuestion.trim(), answer: editAnswer.trim(), category: editCategory }
          : card
      ));
      setEditingCard(null);
      setEditQuestion('');
      setEditAnswer('');
      setEditCategory('');
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditCategory('');
  };

  const getScoreColor = (score: number): string => {
    if (score < 0) return 'bg-red-300 dark:bg-red-600 border-red-400 dark:border-red-500';
    if (score === 0) return 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500';
    if (score === 1) return 'bg-yellow-300 dark:bg-yellow-600 border-yellow-400 dark:border-yellow-500';
    return 'bg-green-300 dark:bg-green-600 border-green-400 dark:border-green-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score === -1) return 'Neumím';
    if (score === 0) return 'Nové';
    if (score === 1) return 'Učím se';
    if (score === 2) return 'Zvládnuté';
    return 'Neznámé';
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  const getFilteredBraincards = (categoryFilter: string): BrainCard[] => {
    if (categoryFilter === 'all') return braincards;
    return braincards.filter(card => card.category === categoryFilter);
  };

  const getQuizBraincards = (): BrainCard[] => {
    return getFilteredBraincards(selectedQuizCategory);
  };

  const getStatsBraincards = (): BrainCard[] => {
    return getFilteredBraincards(selectedStatsCategory);
  };

  const getFilteredAndSearchedCards = (): BrainCard[] => {
    let filtered = braincards;

    // Filter by category
    if (selectedQuizCategory !== 'all') {
      filtered = filtered.filter(card => card.category === selectedQuizCategory);
    }

    // Filter by score
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(card => card.score === scoreFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(card =>
        card.question.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const exportData = () => {
    const data = {
      braincards,
      categories,
      sessionStats,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainfuel-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.braincards || data.flashcards) {
          // Support both old and new format
          const cards = data.braincards || data.flashcards;
          setBraincards(cards.map((card: any) => ({
            ...card,
            createdAt: new Date(card.createdAt),
            lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined
          })));
        }
        if (data.categories) {
          setCategories(data.categories);
        }
        if (data.sessionStats) {
          setSessionStats(data.sessionStats.map((stat: any) => ({
            ...stat,
            date: new Date(stat.date)
          })));
        }
        alert('Data byla úspěšně importována!');
      } catch (error) {
        alert('Chyba při importu dat. Zkontrolujte formát souboru.');
      }
    };
    reader.readAsText(file);
  };

  // Audio functions
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a pleasant success melody
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + (index * 0.1);
        const duration = 0.3;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  };

  const playFailSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a gentle fail sound
      const frequencies = [220, 196]; // A3, G3 - descending

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + (index * 0.15);
        const duration = 0.25;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  };

  // Quiz functions
  const selectRandomCard = () => {
    const quizCards = getQuizBraincards();
    if (quizCards.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quizCards.length);
    // Find the actual index in the full braincards array
    const actualIndex = braincards.findIndex(card => card.id === quizCards[randomIndex].id);
    setCurrentCardIndex(actualIndex);
    setShowAnswer(false);
    setUserAnswer('');
    setFeedback(null);
    setIsAnimating(false);
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAnswer(true);
    evaluateAnswer();
  };

  const evaluateAnswer = () => {
    if (currentCardIndex === null) return;

    const correctAnswer = braincards[currentCardIndex].answer.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    const isCorrect = correctAnswer.includes(userAnswerLower) ||
                     userAnswerLower.includes(correctAnswer) ||
                     correctAnswer === userAnswerLower;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsAnimating(true);

    if (isCorrect) {
      playSuccessSound();
      setCurrentSessionCorrect(prev => prev + 1);
    } else {
      playFailSound();
    }

    setCurrentSessionAnswers(prev => prev + 1);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        totalAnswered: currentUser.totalAnswered + 1,
        correctAnswers: isCorrect ? currentUser.correctAnswers + 1 : currentUser.correctAnswers
      };
      updateUserProgress(updatedUser);
    }

    setBraincards(prev => {
      const newBraincards = [...prev];
      const card = newBraincards[currentCardIndex];

      if (isCorrect) {
        // Správná odpověď
        if (card.score === 0 || card.score === -1) {
          card.score = 1; // Nové nebo Neumím → Učím se
        } else if (card.score === 1) {
          card.score = 2; // Učím se → Zvládnuté
        }
        // Zvládnuté (2) zůstává Zvládnuté (2)
      } else {
        // Špatná odpověď
        if (card.score === 0) {
          card.score = -1; // Nové → Neumím
        } else if (card.score === 2) {
          card.score = 1; // Zvládnuté → Učím se
        } else if (card.score === 1) {
          card.score = -1; // Učím se → Neumím
        }
        // Neumím (-1) zůstává Neumím (-1)
      }

      return newBraincards;
    });

    if (autoAdvance) {
      setTimeout(() => {
        setFeedback(null);
        setIsAnimating(false);
        selectRandomCard();
      }, 1500);
    } else {
      // Pouze ukončit animaci, ale nezačínat novou kartičku
      setTimeout(() => {
        setFeedback(null);
        setIsAnimating(false);
      }, 1500);
    }
  };

  const handleManualAnswer = (isCorrect: boolean) => {
    if (currentCardIndex === null) return;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsAnimating(true);

    if (isCorrect) {
      playSuccessSound();
      setCurrentSessionCorrect(prev => prev + 1);
    } else {
      playFailSound();
    }

    setCurrentSessionAnswers(prev => prev + 1);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        totalAnswered: currentUser.totalAnswered + 1,
        correctAnswers: isCorrect ? currentUser.correctAnswers + 1 : currentUser.correctAnswers
      };
      updateUserProgress(updatedUser);
    }

    setBraincards(prev => {
      const newBraincards = [...prev];
      const card = newBraincards[currentCardIndex];

      if (isCorrect) {
        // Správná odpověď
        if (card.score === 0 || card.score === -1) {
          card.score = 1; // Nové nebo Neumím → Učím se
        } else if (card.score === 1) {
          card.score = 2; // Učím se → Zvládnuté
        }
        // Zvládnuté (2) zůstává Zvládnuté (2)
      } else {
        // Špatná odpověď
        if (card.score === 0) {
          card.score = -1; // Nové → Neumím
        } else if (card.score === 2) {
          card.score = 1; // Zvládnuté → Učím se
        } else if (card.score === 1) {
          card.score = -1; // Učím se → Neumím
        }
        // Neumím (-1) zůstává Neumím (-1)
      }

      return newBraincards;
    });

    if (autoAdvance) {
      setTimeout(() => {
        setFeedback(null);
        setIsAnimating(false);
        selectRandomCard();
      }, 1500);
    } else {
      // Pouze ukončit animaci, ale nezačínat novou kartičku
      setTimeout(() => {
        setFeedback(null);
        setIsAnimating(false);
      }, 1500);
    }
  };

  useEffect(() => {
    const quizCards = getQuizBraincards();
    if (quizCards.length > 0 && currentCardIndex === null) {
      selectRandomCard();
    }
  }, [braincards, currentCardIndex, selectedQuizCategory]);

  // Reset current card when quiz category changes
  useEffect(() => {
    setCurrentCardIndex(null);
    setShowAnswer(false);
    setUserAnswer('');
    setFeedback(null);
    setIsAnimating(false);
  }, [selectedQuizCategory]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cards', label: 'Moje kartičky', icon: '📚' },
    { id: 'practice', label: 'Procvičovat', icon: '🧠' },
    { id: 'stats', label: 'Statistiky', icon: '📈' },
    { id: 'achievements', label: 'Úspěchy', icon: '🏆' },
    { id: 'settings', label: 'Nastavení', icon: '⚙️' },
  ];

  // If user is not logged in, show auth page
  if (!currentUser) {
    return (
      <>
        <AuthPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLogin={setCurrentUser}
          users={users}
          onRegister={(user) => {
            setUsers(prev => [...prev, user]);
            setCurrentUser(user);
          }}
          onShowToast={showToast}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  BrainFuel
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Vítejte, {currentUser.nickname}! 👋
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info with Progressive Avatar */}
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <AvatarImage level={currentUser.level} size="md" showLevel={true} />
                <div className="text-sm">
                  <div className="font-medium text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{currentUser.nickname}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {getAvatarDescription(currentUser.level)}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">{currentUser.email}</div>
                  <div className="w-24 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${getLevelProgress(currentUser).percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl transition-colors duration-200 font-medium"
              >
                Odhlásit se
              </button>

              {/* Theme Toggle */}
              <button
                onClick={handleToggleTheme}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 group"
              >
                <div className="w-6 h-6 relative">
                  {theme === 'light' ? (
                    <svg className="w-6 h-6 text-amber-500 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-blue-400 transition-transform group-hover:-rotate-12" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation with Pills */}
      <nav className="sticky top-20 z-40 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-b border-white/20 dark:border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'cards' | 'practice' | 'stats' | 'achievements' | 'settings')}
                className={`relative px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Vítejte zpět, {currentUser.nickname}! 👋
                  </h2>
                  <p className="text-blue-100">
                    Pokračujte ve svém učení a dosáhněte nových úspěchů
                  </p>
                </div>
                <div className="hidden md:block">
                  <AvatarImage level={currentUser.level} size="xl" showLevel={true} />
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Cards */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Celkem kartiček</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{currentUser.totalCards}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                </div>
              </div>

              {/* Cards Learned */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Naučené</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{currentUser.cardsLearned}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              {/* Cards to Review */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">K procvičení</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{currentUser.cardsToReview}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔄</span>
                  </div>
                </div>
              </div>

              {/* Study Streak */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Série dnů</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{currentUser.studyStreak}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Weekly Goal */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Týdenní cíl</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Pokrok</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentUser.weeklyProgress} / {currentUser.weeklyGoal}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((currentUser.weeklyProgress / currentUser.weeklyGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {currentUser.weeklyProgress >= currentUser.weeklyGoal
                      ? '🎉 Týdenní cíl splněn!'
                      : `Zbývá ${currentUser.weeklyGoal - currentUser.weeklyProgress} kartiček`
                    }
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                  <span>⏰</span>
                  <span>Poslední aktivita</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg">📚</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Poslední učení</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(currentUser.lastActivity).toLocaleDateString('cs-CZ')} v {new Date(currentUser.lastActivity).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg">⏱️</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Celkový čas učení</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {Math.floor(currentUser.totalStudyTime / 60)}h {currentUser.totalStudyTime % 60}min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg">🎯</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Úspěšnost</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {currentUser.totalAnswered > 0 ? Math.round((currentUser.correctAnswers / currentUser.totalAnswered) * 100) : 0}% správných odpovědí
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Rychlé akce</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('practice')}
                  className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">🧠</div>
                  <div>Začít procvičování</div>
                </button>
                <button
                  onClick={() => setActiveTab('cards')}
                  className="p-6 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div>Spravovat kartičky</div>
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="p-6 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">🏆</div>
                  <div>Zobrazit úspěchy</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="space-y-8">
            {/* Add Card Button */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Přidat novou kartičku
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Vytvořte novou kartičku pro procvičování
                </p>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Přidat kartičku</span>
                  </span>
                </button>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Přidat kategorii</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters and Search */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Filtrování a vyhledávání</h2>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Vyhledat kartičku
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Hledat v otázkách a odpovědích..."
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={selectedQuizCategory}
                    onChange={(e) => setSelectedQuizCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white backdrop-blur-sm"
                  >
                    <option value="all">🌟 Všechny kategorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Filter */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Úroveň znalosti
                  </label>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as -1 | 0 | 1 | 2)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white backdrop-blur-sm"
                  >
                    <option value="all">📋 Všechny úrovně</option>
                    <option value={-1}>❌ Neumím</option>
                    <option value={0}>🆕 Nové</option>
                    <option value={1}>📖 Učím se</option>
                    <option value={2}>✅ Zvládnuté</option>
                  </select>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-center">
                <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  Zobrazeno: {getFilteredAndSearchedCards().length} z {flashcards.length} kartiček
                </span>
              </div>
            </div>

            {/* Cards List */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📚</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Vaše kartičky
                  </h2>
                </div>
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {getFilteredAndSearchedCards().length} kartiček
                  </span>
                </div>
              </div>

              {getFilteredAndSearchedCards().length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📝</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {flashcards.length === 0 ? 'Zatím nemáte žádné kartičky' : 'Žádné kartičky nevyhovují filtru'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {flashcards.length === 0
                      ? 'Přidejte první kartičku pomocí tlačítka výše'
                      : 'Zkuste změnit filtry nebo vyhledávací dotaz'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getFilteredAndSearchedCards().map((card, index) => {
                    const category = getCategoryById(card.category);
                    return (
                      <div
                        key={card.id}
                        className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${getScoreColor(card.score)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                                {card.question}
                              </h3>
                              {category && (
                                <div className={`px-3 py-1 bg-gradient-to-r ${category.color} text-white text-xs font-medium rounded-full flex items-center space-x-1`}>
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 ml-11">
                              {card.answer}
                            </p>
                            <div className="flex items-center space-x-4 ml-11 text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                <span>Skóre: {card.score}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span>{card.createdAt.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCard(card)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300"
                              title="Upravit kartičku"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteFlashcard(card.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300"
                              title="Smazat kartičku"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-8">
            {/* Quiz Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">🧠</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Procvičování
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Otestujte své znalosti</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Category Filter */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Kategorie:
                    </label>
                    <select
                      value={selectedQuizCategory}
                      onChange={(e) => setSelectedQuizCategory(e.target.value)}
                      className="px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white text-sm backdrop-blur-sm"
                    >
                      <option value="all">🌟 Všechny kategorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setAutoAdvance(!autoAdvance)}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors duration-200 ${
                        autoAdvance
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      }`}
                      title={autoAdvance ? 'Automatické pokračování zapnuto' : 'Automatické pokračování vypnuto'}
                    >
                      {autoAdvance ? '⏯️ Auto' : '⏸️ Manuál'}
                    </button>

                    <button
                      onClick={selectRandomCard}
                      disabled={isAnimating || getQuizFlashcards().length === 0}
                      className="group px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{autoAdvance ? 'Nová kartička' : 'Další kartička'}</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {getQuizFlashcards().length === 0 ? (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-16">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🤔</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {flashcards.length === 0 ? 'Nemáte žádné kartičky pro kvíz' : 'Žádné kartičky v této kategorii'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {flashcards.length === 0
                      ? 'Přidejte nejdříve nějaké kartičky v sekci "Správa kartiček"'
                      : 'Zkuste vybrat jinou kategorii nebo přidejte kartičky do této kategorie'
                    }
                  </p>
                </div>
              </div>
            ) : currentCardIndex !== null ? (
              <div className={`transition-all duration-500 ${
                isAnimating && feedback === 'correct' ? 'animate-success' :
                isAnimating && feedback === 'incorrect' ? 'animate-error' : ''
              }`}>
                {/* Question Card */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8 mb-8">
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center space-x-2 text-slate-500 dark:text-slate-400">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium">Otázka</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-relaxed">
                      {flashcards[currentCardIndex].question}
                    </h3>

                    <form onSubmit={handleSubmitAnswer} className="space-y-6">
                      <div className="max-w-md mx-auto">
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          disabled={isAnimating}
                          className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm text-center text-lg"
                          placeholder="Zadejte vaši odpověď..."
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAnimating}
                        className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Vyhodnotit</span>
                        </span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Answer Card */}
                {showAnswer && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 backdrop-blur-xl rounded-3xl border border-blue-200/50 dark:border-slate-700/50 shadow-xl shadow-blue-500/10 p-8 mb-8">
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-sm font-medium">Správná odpověď</span>
                      </div>
                      <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100 leading-relaxed">
                        {flashcards[currentCardIndex].answer}
                      </h3>

                      {userAnswer && (
                        <div className="max-w-md mx-auto p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-slate-700/30">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Vaše odpověď: <span className="font-semibold text-slate-900 dark:text-white">{userAnswer}</span>
                          </p>
                        </div>
                      )}

                      {!feedback && !isAnimating && (
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => handleManualAnswer(true)}
                            className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105"
                          >
                            <span className="flex items-center space-x-2">
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Správně</span>
                            </span>
                          </button>
                          <button
                            onClick={() => handleManualAnswer(false)}
                            className="group px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
                          >
                            <span className="flex items-center space-x-2">
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Špatně</span>
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {feedback && isAnimating && (
                  <div className="text-center py-8">
                    <div className={`inline-flex items-center space-x-3 px-8 py-6 rounded-3xl text-white font-bold text-xl shadow-2xl animate-bounce-in ${
                      feedback === 'correct'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/40 animate-glow'
                        : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/40'
                    }`}>
                      {feedback === 'correct' ? (
                        <>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span>Výborně! 🎉</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <span>Zkuste to znovu! 💪</span>
                        </>
                      )}
                    </div>
                    {feedback && currentCardIndex !== null && (
                      <div className="mt-4 text-center animate-slide-up">
                        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                          feedback === 'correct'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          <span>Kartička je nyní:</span>
                          <span className="font-bold">{getScoreLabel(flashcards[currentCardIndex].score)}</span>
                          <span className="text-xs opacity-75">(skóre: {flashcards[currentCardIndex].score})</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Info */}
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                  <div className="flex justify-center items-center space-x-8 text-sm">
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"></div>
                      <span>Skóre: <span className="font-semibold text-slate-900 dark:text-white">{flashcards[currentCardIndex].score}</span></span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                      <span>Kartička: <span className="font-semibold text-slate-900 dark:text-white">{getQuizFlashcards().findIndex(card => card.id === flashcards[currentCardIndex].id) + 1} / {getQuizFlashcards().length}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-spin">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">Načítání...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Stats Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Statistiky
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Přehled vašeho pokroku</p>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Kategorie:
                  </label>
                  <select
                    value={selectedStatsCategory}
                    onChange={(e) => setSelectedStatsCategory(e.target.value)}
                    className="px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white text-sm backdrop-blur-sm"
                  >
                    <option value="all">🌟 Všechny kategorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {getStatsFlashcards().length === 0 ? (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-16">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {flashcards.length === 0 ? 'Zatím nemáte žádné statistiky' : 'Žádné kartičky v této kategorii'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {flashcards.length === 0
                      ? 'Přidejte kartičky a začněte procvičovat!'
                      : 'Zkuste vybrat jinou kategorii nebo přidejte kartičky do této kategorie'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Modern Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/25">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Celkem</p>
                        <p className="text-3xl font-bold">{getStatsFlashcards().length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">📚</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 text-white shadow-xl shadow-red-500/25">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm font-medium">Neumím</p>
                        <p className="text-3xl font-bold">{getStatsFlashcards().filter(card => card.score === -1).length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">❌</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-3xl p-6 text-white shadow-xl shadow-slate-500/25">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-100 text-sm font-medium">Nové</p>
                        <p className="text-3xl font-bold">{getStatsFlashcards().filter(card => card.score === 0).length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">🆕</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/25">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-sm font-medium">Učím se</p>
                        <p className="text-3xl font-bold">{getStatsFlashcards().filter(card => card.score === 1).length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">📖</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/25">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium">Zvládnuté</p>
                        <p className="text-3xl font-bold">{getStatsFlashcards().filter(card => card.score === 2).length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pokrok učení</h3>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Pokrok učení (Učím se + Zvládnuté)</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {getStatsFlashcards().length > 0 ? Math.round(((getStatsFlashcards().filter(card => card.score >= 1).length) / getStatsFlashcards().length) * 100) : 0}%
                      </span>
                    </div>

                    <div className="relative">
                      <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                          style={{
                            width: `${getStatsFlashcards().length > 0 ? ((getStatsFlashcards().filter(card => card.score >= 1).length) / getStatsFlashcards().length) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>Neumím/Nové</span>
                        <span>Učím se/Zvládnuté</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">
                    Rozložení kartiček podle pokroku
                  </h3>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: 'Neumím (skóre -1)',
                              value: getStatsFlashcards().filter(card => card.score === -1).length,
                              color: '#ef4444'
                            },
                            {
                              name: 'Nové (skóre 0)',
                              value: getStatsFlashcards().filter(card => card.score === 0).length,
                              color: '#64748b'
                            },
                            {
                              name: 'Učím se (skóre 1)',
                              value: getStatsFlashcards().filter(card => card.score === 1).length,
                              color: '#f59e0b'
                            },
                            {
                              name: 'Zvládnuté (skóre 2)',
                              value: getStatsFlashcards().filter(card => card.score === 2).length,
                              color: '#10b981'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { color: '#ef4444' },
                            { color: '#64748b' },
                            { color: '#f59e0b' },
                            { color: '#10b981' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(16px)'
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detailed List */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                    Přehled všech kartiček
                  </h3>
                  <div className="space-y-3">
                    {getStatsFlashcards().map((card, index) => {
                      const category = getCategoryById(card.category);
                      return (
                        <div
                          key={card.id}
                          className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${getScoreColor(card.score)}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {card.question}
                                  </div>
                                  {category && (
                                    <div className={`px-2 py-1 bg-gradient-to-r ${category.color} text-white text-xs font-medium rounded-full flex items-center space-x-1`}>
                                      <span>{category.icon}</span>
                                      <span>{category.name}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  {card.answer}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {card.score}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                skóre
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-8">
            {/* Achievements Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Úspěchy
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    {getUnlockedAchievements(currentUser).length} z {allAchievements.length} odemčeno
                  </p>
                </div>
              </div>
            </div>

            {/* Achievement Categories */}
            {['progress', 'mastery', 'special'].map(category => {
              const categoryAchievements = allAchievements.filter(a => a.category === category);
              const categoryNames = {
                progress: 'Pokrok',
                mastery: 'Mistrovství',
                special: 'Speciální'
              };
              const categoryIcons = {
                progress: '📈',
                mastery: '⭐',
                special: '🎯'
              };

              return (
                <div key={category} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
                    <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
                    <span>{categoryNames[category as keyof typeof categoryNames]}</span>
                  </h3>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map(achievement => {
                      const isUnlocked = getUnlockedAchievements(currentUser).some(a => a.id === achievement.id);
                      const progress = getAchievementProgress(achievement, currentUser);

                      const rarityColors = {
                        common: 'from-gray-400 to-gray-600',
                        rare: 'from-blue-400 to-blue-600',
                        epic: 'from-purple-400 to-purple-600',
                        legendary: 'from-yellow-400 to-orange-500'
                      };

                      const rarityBorders = {
                        common: 'border-gray-300',
                        rare: 'border-blue-300',
                        epic: 'border-purple-300',
                        legendary: 'border-yellow-300'
                      };

                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                            isUnlocked
                              ? `${rarityBorders[achievement.rarity]} bg-gradient-to-br ${rarityColors[achievement.rarity]}/10 shadow-lg`
                              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 opacity-60'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`text-4xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
                              {achievement.icon}
                            </div>
                            <h4 className={`font-bold mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                              {achievement.title}
                            </h4>
                            <p className={`text-sm mb-3 ${isUnlocked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                              {achievement.description}
                            </p>

                            {!isUnlocked && (
                              <div className="space-y-2">
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {achievement.requirement.description}
                                </p>
                              </div>
                            )}

                            {isUnlocked && (
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ ODEMČENO</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Settings Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">⚙️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Nastavení
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">Správa dat a konfigurace</p>
                </div>
              </div>
            </div>

            {/* User Progress & Avatar Evolution */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Váš pokrok a avatar</h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Avatar Evolution */}
                <div className="text-center">
                  <div className="mb-4">
                    <AvatarImage level={currentUser.level} size="xl" showLevel={true} className="mx-auto" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Level {currentUser.level} - {getAvatarDescription(currentUser.level)}
                  </h4>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${getLevelProgress(currentUser).percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {Math.round(getLevelProgress(currentUser).percentage)}% do dalšího levelu
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentUser.totalAnswered}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Odpovědí</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {currentUser.correctAnswers}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Správných</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {currentUser.cardsLearned}
                      </div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">Naučených</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {currentUser.cardsMastered}
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">Zvládnutých</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Úspěšnost: {currentUser.totalAnswered > 0 ? Math.round((currentUser.correctAnswers / currentUser.totalAnswered) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Nedávné úspěchy</h4>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Zobrazit všechny →
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getUnlockedAchievements(currentUser).slice(-5).map((achievement) => (
                    <span
                      key={achievement.id}
                      className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg flex items-center space-x-1"
                    >
                      <span>{achievement.icon}</span>
                      <span>{achievement.title}</span>
                    </span>
                  ))}
                  {getUnlockedAchievements(currentUser).length === 0 && (
                    <span className="text-slate-500 dark:text-slate-400 italic">
                      Zatím žádné úspěchy. Pokračujte v učení!
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar Evolution Preview */}
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Evoluce avataru</h4>
                  {/* Debug: Test Level Buttons */}
                  <div className="flex space-x-1">
                    {[0, 1, 3, 5, 8].map(testLevel => (
                      <button
                        key={testLevel}
                        onClick={() => {
                          if (currentUser) {
                            const testUser = { ...currentUser, level: testLevel };
                            setCurrentUser(testUser);
                            localStorage.setItem('currentUser', JSON.stringify(testUser));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                      >
                        L{testLevel}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {[0, 2, 4, 7, 10].map((levelThreshold, index) => {
                    const isUnlocked = currentUser.level >= levelThreshold;
                    const avatarLevel = [0, 2, 4, 7, 10][index]; // Map to actual levels for avatar selection

                    return (
                      <div
                        key={index}
                        className={`text-center p-4 rounded-xl border-2 transition-all duration-200 ${
                          isUnlocked
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 opacity-50'
                        }`}
                      >
                        <div className="mb-2">
                          <img
                            src={getAvatarForLevel(avatarLevel)}
                            alt={`Avatar level ${avatarLevel}`}
                            className={`w-16 h-16 mx-auto rounded-full border-2 ${
                              isUnlocked ? 'border-green-400' : 'border-slate-300 dark:border-slate-600'
                            }`}
                          />
                        </div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {getAvatarDescription(avatarLevel)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Level {levelThreshold}+
                        </div>
                        {isUnlocked && (
                          <div className="mt-1">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 text-center">
                  Váš avatar se vyvíjí podle vašeho pokroku v učení. Odpovídejte správně a odemykejte nové podoby!
                </p>
              </div>
            </div>

            {/* Import/Export */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Import a Export dat</h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Export */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Export dat</h4>
                  <p className="text-slate-600 dark:text-slate-400">Stáhněte všechna vaše data jako JSON soubor</p>
                  <button
                    onClick={exportData}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportovat data</span>
                    </span>
                  </button>
                </div>

                {/* Import */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Import dat</h4>
                  <p className="text-slate-600 dark:text-slate-400">Nahrajte JSON soubor s daty</p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                    <div className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 cursor-pointer text-center">
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Importovat data</span>
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Session Statistics */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Aktuální session</h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {currentSessionAnswers}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Celkem odpovědí
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {currentSessionCorrect}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Správných odpovědí
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {currentSessionAnswers > 0 ? Math.round((currentSessionCorrect / currentSessionAnswers) * 100) : 0}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Úspěšnost
                  </div>
                </div>
              </div>

              {currentSessionAnswers > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      const newStat: SessionStats = {
                        date: new Date(),
                        totalAnswered: currentSessionAnswers,
                        correctAnswers: currentSessionCorrect,
                        accuracy: (currentSessionCorrect / currentSessionAnswers) * 100,
                        cardsImproved: 0 // TODO: Calculate this
                      };
                      setSessionStats(prev => [...prev, newStat]);
                      setCurrentSessionAnswers(0);
                      setCurrentSessionCorrect(0);
                      alert('Session byla uložena!');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    Uložit session
                  </button>
                </div>
              )}
            </div>

            {/* App Settings */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-black/5 p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Nastavení aplikace</h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Automatické pokračování</h4>
                    <p className="text-slate-600 dark:text-slate-400">Automaticky přejít na další kartičku po odpovědi</p>
                  </div>
                  <button
                    onClick={() => setAutoAdvance(!autoAdvance)}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      autoAdvance ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        autoAdvance ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Tmavý režim</h4>
                    <p className="text-slate-600 dark:text-slate-400">Přepnout mezi světlým a tmavým vzhledem</p>
                  </div>
                  <button
                    onClick={handleToggleTheme}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Demo Reset Section */}
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Demo režim</h4>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Obnovit demo účty</h5>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                        Toto smaže všechna data a obnoví původní demo účty pro testování aplikace.
                      </p>
                      <button
                        onClick={resetToDemo}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-colors duration-200"
                      >
                        🎮 Obnovit demo účty
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 max-w-2xl w-full animate-bounce-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Přidat novou kartičku</h3>
            <form onSubmit={handleAddFlashcard} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Kategorie
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white backdrop-blur-sm"
                    required
                  >
                    <option value="">Vyberte kategorii...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Přidat kategorii</span>
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Otázka
                  </label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                    placeholder="Zadejte otázku..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Odpověď
                  </label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                    placeholder="Zadejte odpověď..."
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCard(false);
                    setQuestion('');
                    setAnswer('');
                    setSelectedCategory('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold transition-colors duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                  Přidat kartičku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 max-w-md w-full animate-bounce-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Přidat novou kategorii</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Název kategorie
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                  placeholder="Název kategorie..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ikona
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm text-center text-2xl"
                    placeholder="📝"
                    maxLength={2}
                    required
                  />
                  <div className="grid grid-cols-6 gap-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategoryIcon(icon)}
                        className={`p-3 rounded-xl text-2xl transition-all duration-200 hover:scale-110 ${
                          newCategoryIcon === icon
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                    setNewCategoryIcon('📝');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold transition-colors duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                  Přidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 max-w-2xl w-full animate-bounce-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Upravit kartičku</h3>
            <form onSubmit={handleUpdateCard} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Kategorie
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white backdrop-blur-sm"
                  required
                >
                  <option value="">Vyberte kategorii...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Otázka
                </label>
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                  placeholder="Otázka..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Odpověď
                </label>
                <input
                  type="text"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                  placeholder="Odpověď..."
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold transition-colors duration-200"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
                >
                  Uložit změny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Achievement Popup */}
      {showAchievementPopup && (
        <AchievementPopup achievement={showAchievementPopup} />
      )}
    </div>
  );
}

export default App;
