import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Code, Trophy, Clock, Star, Filter, Search } from 'lucide-react';

export const Challenges: React.FC = () => {
  const { user, challenges, setCurrentView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'sql' | 'python'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  if (!user) return null;

  const filteredChallenges = challenges.filter(challenge => {
    const matchesRole = challenge.roles.includes(user.role);
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || challenge.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty;
    
    return matchesRole && matchesSearch && matchesType && matchesDifficulty;
  });

  const completedCount = filteredChallenges.filter(c => c.completed).length;
  
  const roleColors = {
    analyst: 'from-blue-500 to-blue-600',
    scientist: 'from-purple-500 to-purple-600',
    engineer: 'from-green-500 to-green-600'
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${roleColors[user.role]} text-white p-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Challenges</h1>
                <p className="text-blue-100">Practice with real-world problems and earn XP</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedCount}/{filteredChallenges.length}</div>
              <div className="text-blue-100">Completed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 mr-2">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="sql">SQL</option>
                  <option value="python">Python</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Difficulty:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                challenge.completed ? 'ring-2 ring-green-200 bg-green-50' : ''
              }`}
              onClick={() => setCurrentView(`challenge-${challenge.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {challenge.type === 'sql' ? (
                    <Database className="w-6 h-6 text-blue-500 mr-2" />
                  ) : (
                    <Code className="w-6 h-6 text-green-500 mr-2" />
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                {challenge.completed && (
                  <div className="flex items-center text-green-600">
                    <Trophy className="w-5 h-5 mr-1" />
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{challenge.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{challenge.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">+{challenge.xpReward} XP</span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {challenge.category}
                  </div>
                </div>
                {challenge.completedAt && (
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-xs">
                      {new Date(challenge.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};