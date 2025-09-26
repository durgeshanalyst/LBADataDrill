import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { useApp } from '../context/AppContext';
import { Database, Code, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

const roleData = {
  analyst: {
    title: 'Data Analyst',
    description: 'Focus on SQL mastery, data visualization, and business intelligence',
    icon: BarChart3,
    color: 'bg-blue-500',
    skills: ['SQL Queries', 'Data Visualization', 'Business Intelligence', 'Reporting'],
    learningPath: '25+ SQL challenges, 15+ visualization projects, BI tool integration'
  },
  scientist: {
    title: 'Data Scientist',
    description: 'Master Python, machine learning, and statistical modeling',
    icon: Code,
    color: 'bg-purple-500',
    skills: ['Python/Pandas', 'Machine Learning', 'Statistics', 'Model Deployment'],
    learningPath: '30+ Python challenges, 20+ ML projects, statistical analysis'
  },
  engineer: {
    title: 'Data Engineer',
    description: 'Build ETL pipelines, optimize databases, and manage big data',
    icon: Database,
    color: 'bg-green-500',
    skills: ['ETL Pipelines', 'Database Optimization', 'Big Data Tools', 'Cloud Platforms'],
    learningPath: '35+ engineering challenges, pipeline projects, optimization tasks'
  }
};

export const Onboarding: React.FC = () => {
  const { setUser, setCurrentView } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<'welcome' | 'role-selection' | 'profile-setup'>('welcome');
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleNext = () => {
    if (step === 'welcome') {
      setStep('role-selection');
    } else if (step === 'role-selection' && selectedRole) {
      setStep('profile-setup');
    }
  };

  const handleComplete = () => {
    if (formData.name && formData.email && selectedRole) {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: selectedRole,
        level: 1,
        totalXP: 0,
        streak: 0,
        joinDate: new Date().toISOString()
      };
      setUser(newUser);
      setCurrentView('dashboard');
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
              <Database className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to LBA Data-Drill
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The ultimate practice platform for SQL and Python, designed specifically for Data Analysts, 
              Data Scientists, and Data Engineers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive Learning</h3>
              <p className="text-gray-600 text-sm">Practice with real datasets in our sandbox environments</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Code className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Auto-Grading</h3>
              <p className="text-gray-600 text-sm">Get instant feedback with our smart validation system</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Career-Focused</h3>
              <p className="text-gray-600 text-sm">Role-specific learning paths tailored to your goals</p>
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 inline-flex items-center"
          >
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Learning Path</h2>
            <p className="text-lg text-gray-600">Select your role to get a personalized learning experience</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {(Object.entries(roleData) as [UserRole, typeof roleData.analyst][]).map(([role, data]) => {
              const Icon = data.icon;
              const isSelected = selectedRole === role;
              
              return (
                <div
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`bg-white p-8 rounded-xl shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 ${
                    isSelected ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-16 h-16 ${data.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{data.title}</h3>
                  <p className="text-gray-600 mb-6">{data.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Key Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Learning Path:</strong> {data.learningPath}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-4 text-center">
                      <CheckCircle className="w-6 h-6 text-blue-500 mx-auto" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <button
              onClick={handleNext}
              disabled={!selectedRole}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              Continue <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${selectedRole ? roleData[selectedRole].color : 'bg-gray-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {selectedRole && React.createElement(roleData[selectedRole].icon, { className: "w-8 h-8 text-white" })}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">
            You've chosen the <strong>{selectedRole ? roleData[selectedRole].title : ''}</strong> path
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <button
            onClick={handleComplete}
            disabled={!formData.name || !formData.email}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Learning Journey
          </button>
        </div>
      </div>
    </div>
  );
};