import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BrainCard } from '../types';

interface BrainFuelStatsProps {
  braincards: BrainCard[];
}

const BrainFuelStats: React.FC<BrainFuelStatsProps> = ({ braincards }) => {
  // Calculate statistics
  const stats = braincards.reduce(
    (acc, card) => {
      if (card.score === 0) {
        acc.novice++;
      } else if (card.score === 1) {
        acc.learning++;
      } else {
        acc.mastered++;
      }
      return acc;
    },
    { novice: 0, learning: 0, mastered: 0 }
  );

  const data = [
    {
      name: 'Nové (skóre 0)',
      value: stats.novice,
      color: '#9CA3AF', // gray-400
      darkColor: '#6B7280', // gray-500
    },
    {
      name: 'Učím se (skóre 1)',
      value: stats.learning,
      color: '#FCD34D', // yellow-300
      darkColor: '#F59E0B', // yellow-500
    },
    {
      name: 'Zvládnuté (skóre 2+)',
      value: stats.mastered,
      color: '#86EFAC', // green-300
      darkColor: '#10B981', // green-500
    },
  ];

  const totalCards = braincards.length;

  // Custom label function for the pie chart
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / totalCards) * 100).toFixed(1);
    return `${percent}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = ((data.value / totalCards) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="text-gray-800 dark:text-white font-medium">{data.name}</p>
          <p className="text-gray-600 dark:text-gray-300">
            Počet: {data.value} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (totalCards === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Statistiky
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Zatím nemáte žádné kartičky.
          </p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            Přidejte kartičky a začněte procvičovat!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Statistiky
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {totalCards}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Celkem kartiček
          </div>
        </div>
        
        <div className="bg-gray-300 dark:bg-gray-600 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.novice}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Nové
          </div>
        </div>
        
        <div className="bg-yellow-300 dark:bg-yellow-600 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.learning}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Učím se
          </div>
        </div>
        
        <div className="bg-green-300 dark:bg-green-600 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.mastered}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Zvládnuté
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="dark:fill-current dark:text-gray-400"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
              }}
              formatter={(value, entry: any) => (
                <span className="text-gray-700 dark:text-gray-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Information */}
      <div className="mt-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">Pokrok učení:</span>
          <span className="font-medium text-gray-800 dark:text-white">
            {totalCards > 0 ? Math.round(((stats.learning + stats.mastered) / totalCards) * 100) : 0}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${totalCards > 0 ? ((stats.learning + stats.mastered) / totalCards) * 100 : 0}%` 
            }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>Začátečník</span>
          <span>Expert</span>
        </div>
      </div>
    </div>
  );
};

export default BrainFuelStats;
