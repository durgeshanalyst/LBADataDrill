import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Target, Flame, Calendar, TrendingUp, Code, Database } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, challenges, badges, setCurrentView } = useApp();

  if (!user) return null;

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalChallenges = challenges.length;
  const earnedBadges = badges.filter(b => b.earned).length;
  const progressPercentage = (completedChallenges / totalChallenges) * 100;

  const roleChallenges = challenges.filter(c => c.roles.includes(user.role));
  const recentChallenges = roleChallenges.slice(0, 4);

  const roleColors = {
    analyst: 'from-blue-500 to-blue-600',
    scientist: 'from-purple-500 to-purple-600',
    engineer: 'from-green-500 to-green-600'
  };

  const roleNames = {
    analyst: 'Data Analyst',
    scientist: 'Data Scientist',
    engineer: 'Data Engineer'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${roleColors[user.role]} text-white p-8`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
              <p className="text-blue-100 text-lg">{roleNames[user.role]} • Level {user.level}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{user.totalXP} XP</div>
              <div className="text-blue-100">Total Experience</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{completedChallenges}</div>
                <div className="text-gray-600">Challenges</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{earnedBadges}</div>
                <div className="text-gray-600">Badges</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{user.streak}</div>
                <div className="text-gray-600">Day Streak</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{user.level}</div>
                <div className="text-gray-600">Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Progress</h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${roleColors[user.role]} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {completedChallenges} of {totalChallenges} challenges completed
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('sql-practice')}
                className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Database className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium">SQL Practice</span>
              </button>
              <button
                onClick={() => setCurrentView('python-practice')}
                className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Code className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium">Python Practice</span>
              </button>
              <button
                onClick={() => setCurrentView('challenges')}
                className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Target className="w-5 h-5 text-purple-500 mr-3" />
                <span className="font-medium">Browse Challenges</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Challenges */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended Challenges</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setCurrentView(`challenge-${challenge.id}`)}
              >
                <div className="flex items-center mb-3">
                  {challenge.type === 'sql' ? (
                    <Database className="w-5 h-5 text-blue-500 mr-2" />
                  ) : (
                    <Code className="w-5 h-5 text-green-500 mr-2" />
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    challenge.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{challenge.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{challenge.category}</span>
                  <span className="text-sm font-medium text-blue-600">+{challenge.xpReward} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};