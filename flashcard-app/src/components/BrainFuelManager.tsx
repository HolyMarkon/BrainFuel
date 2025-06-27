import React, { useState } from 'react';
import type { BrainCard } from '../types';

interface BrainFuelManagerProps {
  braincards: BrainCard[];
  onAddBraincard: (question: string, answer: string) => void;
  onDeleteBraincard: (id: string) => void;
  onEditBraincard: (id: string, question: string, answer: string) => void;
  lastAnsweredId?: string;
}

const BrainFuelManager: React.FC<BrainFuelManagerProps> = ({
  braincards,
  onAddBraincard,
  onDeleteBraincard,
  onEditBraincard,
  lastAnsweredId,
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && answer.trim()) {
      onAddBraincard(question.trim(), answer.trim());
      setQuestion('');
      setAnswer('');
    }
  };

  const handleEdit = (card: BrainCard) => {
    setEditingId(card.id);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const handleSaveEdit = () => {
    if (editingId && editQuestion.trim() && editAnswer.trim()) {
      onEditBraincard(editingId, editQuestion.trim(), editAnswer.trim());
      setEditingId(null);
      setEditQuestion('');
      setEditAnswer('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const getScoreColor = (score: number): string => {
    if (score === 0) return 'bg-gray-300 dark:bg-gray-600';
    if (score === 1) return 'bg-yellow-300 dark:bg-yellow-600';
    return 'bg-green-300 dark:bg-green-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Správa kartiček
      </h2>

      {/* Add new flashcard form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Otázka
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Zadejte otázku..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Odpověď
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Zadejte odpověď..."
            required
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                   text-white rounded-lg transition-colors duration-200"
        >
          ➕ Přidat kartičku
        </button>
      </form>

      {/* BrainCards list */}
      <div className="space-y-4">
        {braincards.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Zatím nemáte žádné kartičky. Přidejte první!
          </p>
        ) : (
          braincards.map((card) => (
            <div
              key={card.id}
              className={`p-4 rounded-xl shadow-md transition-all duration-300 ${getScoreColor(card.score)} 
                         ${lastAnsweredId === card.id ? 'ring-4 ring-blue-400 animate-scale-up' : ''}
                         hover:shadow-lg`}
            >
              {editingId === card.id ? (
                // Edit mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                             bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Otázka..."
                  />
                  <input
                    type="text"
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                             bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Odpověď..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                    >
                      Uložit
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-2">
                      Q: {card.question}
                    </div>
                    <div className="text-gray-700 mb-2">
                      A: {card.answer}
                    </div>
                    <div className="text-sm text-gray-600">
                      Skóre: {card.score} | Vytvořeno: {card.createdAt.toLocaleDateString()}
                      {card.lastAnswered && (
                        <span> | Naposledy: {card.lastAnswered.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Upravit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteBraincard(card.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Smazat"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrainFuelManager;
