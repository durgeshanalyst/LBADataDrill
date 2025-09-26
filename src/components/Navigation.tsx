import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Database, 
  Code, 
  Target, 
  Trophy, 
  User, 
  BookOpen,
  BarChart3,
  Menu,
  X 
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user, currentView, setCurrentView } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (!user) return null;

  const roleColors = {
    analyst: 'bg-blue-500',
    scientist: 'bg-purple-500',
    engineer: 'bg-green-500'
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'challenges', name: 'Challenges', icon: Target },
    { id: 'sql-practice', name: 'SQL Practice', icon: Database },
    { id: 'python-practice', name: 'Python Practice', icon: Code },
    { id: 'learning-path', name: 'Learning Path', icon: BookOpen },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className={`w-8 h-8 ${roleColors[user.role]} rounded-lg flex items-center justify-center mr-3`}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">LBA DataDrill</h1>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
                      isActive
                        ? `${roleColors[user.role]} text-white`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${roleColors[user.role]} rounded-full flex items-center justify-center`}>
                <span className="text-white font-medium">{user.name.charAt(0)}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">Level {user.level}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <div className={`w-8 h-8 ${roleColors[user.role]} rounded-lg flex items-center justify-center mr-3`}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">DataMaster Pro</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="bg-white border-b border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`group flex items-center px-3 py-2 text-base font-medium rounded-md w-full text-left transition-colors ${
                      isActive
                        ? `${roleColors[user.role]} text-white`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};