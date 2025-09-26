export type UserRole = 'analyst' | 'scientist' | 'engineer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  level: number;
  totalXP: number;
  streak: number;
  joinDate: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedAt?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'sql' | 'python';
  roles: UserRole[];
  category: string;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
  testCases?: TestCase[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface Database {
  id: string;
  name: string;
  description: string;
  tables: Table[];
}

export interface Table {
  name: string;
  columns: Column[];
  data: Record<string, any>[];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
}

export interface LearningPath {
  role: UserRole;
  title: string;
  description: string;
  modules: Module[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  challenges: string[];
  unlocked: boolean;
}