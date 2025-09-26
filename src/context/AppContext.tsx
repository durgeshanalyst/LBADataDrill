import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Challenge, Badge } from '../types';
import { mockChallenges, mockBadges } from '../data/mockData';

interface AppContextType {
  user: User | null;
  challenges: Challenge[];
  badges: Badge[];
  currentView: string;
  setCurrentView: (view: string) => void;
  setUser: (user: User) => void;
  completeChallenge: (challengeId: string) => void;
  earnBadge: (badgeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [badges, setBadges] = useState<Badge[]>(mockBadges);
  const [currentView, setCurrentView] = useState('dashboard');

  const setUser = (newUser: User) => {
    setUserState(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const completeChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, completed: true, completedAt: new Date().toISOString() }
        : challenge
    ));
    
    if (user) {
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        const updatedUser = {
          ...user,
          totalXP: user.totalXP + challenge.xpReward,
          level: Math.floor((user.totalXP + challenge.xpReward) / 1000) + 1
        };
        setUser(updatedUser);
      }
    }
  };

  const earnBadge = (badgeId: string) => {
    setBadges(prev => prev.map(badge => 
      badge.id === badgeId 
        ? { ...badge, earned: true, earnedAt: new Date().toISOString() }
        : badge
    ));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUserState(JSON.parse(savedUser));
    }
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      challenges,
      badges,
      currentView,
      setCurrentView,
      setUser,
      completeChallenge,
      earnBadge
    }}>
      {children}
    </AppContext.Provider>
  );
};