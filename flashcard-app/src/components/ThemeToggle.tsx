import React from 'react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex items-center justify-center w-14 h-8 
                 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 focus:ring-offset-white dark:focus:ring-offset-gray-800"
      aria-label={`Přepnout na ${theme === 'light' ? 'tmavý' : 'světlý'} režim`}
    >
      {/* Toggle background */}
      <div
        className={`absolute inset-0 rounded-full transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-blue-600' 
            : 'bg-gray-300'
        }`}
      />
      
      {/* Toggle circle */}
      <div
        className={`relative w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
          theme === 'dark' ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm">
            {theme === 'light' ? '☀️' : '🌙'}
          </span>
        </div>
      </div>
      
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <span className={`text-xs transition-opacity duration-300 ${
          theme === 'light' ? 'opacity-100' : 'opacity-50'
        }`}>
          ☀️
        </span>
        <span className={`text-xs transition-opacity duration-300 ${
          theme === 'dark' ? 'opacity-100' : 'opacity-50'
        }`}>
          🌙
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
