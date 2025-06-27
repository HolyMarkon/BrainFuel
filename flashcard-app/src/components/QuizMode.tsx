import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { playSuccessSound, playFailSound } from '../utils/audio';

interface QuizModeProps {
  flashcards: Flashcard[];
  onUpdateScore: (index: number, isCorrect: boolean) => void;
}

const QuizMode: React.FC<QuizModeProps> = ({ flashcards, onUpdateScore }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Select random card on component mount or when flashcards change
  useEffect(() => {
    if (flashcards.length > 0 && currentCardIndex === null) {
      selectRandomCard();
    }
  }, [flashcards, currentCardIndex]);

  const selectRandomCard = () => {
    if (flashcards.length === 0) return;
    const randomIndex = Math.floor(Math.random() * flashcards.length);
    setCurrentCardIndex(randomIndex);
    setShowAnswer(false);
    setUserAnswer('');
    setFeedback(null);
    setIsAnimating(false);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (currentCardIndex === null) return;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsAnimating(true);

    // Play sound effect
    if (isCorrect) {
      playSuccessSound();
    } else {
      playFailSound();
    }

    // Update score
    onUpdateScore(currentCardIndex, isCorrect);

    // Reset animation and move to next card after delay
    setTimeout(() => {
      setIsAnimating(false);
      selectRandomCard();
    }, 1500);
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAnswer) {
      handleShowAnswer();
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Kvíz
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nemáte žádné kartičky pro kvíz.
          </p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            Přidejte nejdříve nějaké kartičky v sekci "Správa kartiček".
          </p>
        </div>
      </div>
    );
  }

  const currentCard = currentCardIndex !== null ? flashcards[currentCardIndex] : null;

  if (!currentCard) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Kvíz
        </h2>
        <button
          onClick={selectRandomCard}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                   text-white rounded-lg transition-colors duration-200"
          disabled={isAnimating}
        >
          🔄 Nová kartička
        </button>
      </div>

      <div 
        className={`transition-all duration-500 ${
          isAnimating 
            ? feedback === 'correct' 
              ? 'animate-success bg-green-100 dark:bg-green-900' 
              : 'animate-error bg-red-100 dark:bg-red-900'
            : ''
        }`}
      >
        {/* Question Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">
              Otázka:
            </h3>
            <p className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              {currentCard.question}
            </p>
            
            {/* User input for answer */}
            {!showAnswer && (
              <form onSubmit={handleSubmitAnswer} className="mb-4">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           bg-white dark:bg-gray-600 text-gray-900 dark:text-white mx-auto block"
                  placeholder="Zadejte vaši odpověď..."
                  disabled={isAnimating}
                />
                <button
                  type="submit"
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white 
                           rounded-lg transition-colors duration-200"
                  disabled={isAnimating}
                >
                  Zobrazit odpověď
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Answer Card */}
        {showAnswer && (
          <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-blue-600 dark:text-blue-300 mb-4">
                Správná odpověď:
              </h3>
              <p className="text-xl font-semibold text-blue-800 dark:text-blue-100 mb-6">
                {currentCard.answer}
              </p>
              
              {userAnswer && (
                <div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Vaše odpověď: <span className="font-medium">{userAnswer}</span>
                  </p>
                </div>
              )}

              {!isAnimating && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 
                             text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    ✅ Správně
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 
                             text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    ❌ Špatně
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && isAnimating && (
          <div className="text-center py-4">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium
                           ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
              {feedback === 'correct' ? '✅' : '❌'}
              {feedback === 'correct' ? 'Výborně!' : 'Zkuste to znovu příště!'}
            </div>
          </div>
        )}

        {/* Card Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Aktuální skóre kartičky: {currentCard.score} | 
          Kartička {(currentCardIndex || 0) + 1} z {flashcards.length}
        </div>
      </div>
    </div>
  );
};

export default QuizMode;
