import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Onboarding } from './components/Onboarding';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SQLPractice } from './components/SQLPractice';
import { PythonPractice } from './components/PythonPractice';
import { Challenges } from './components/Challenges';

const AppContent: React.FC = () => {
  const { user, currentView } = useApp();

  if (!user) {
    return <Onboarding />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'challenges':
        return <Challenges />;
      case 'sql-practice':
        return <SQLPractice />;
      case 'python-practice':
        return <PythonPractice />;
      case 'learning-path':
        return <Dashboard />; // Placeholder
      case 'leaderboard':
        return <Dashboard />; // Placeholder
      case 'profile':
        return <Dashboard />; // Placeholder
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1 lg:ml-64">
        {renderCurrentView()}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;