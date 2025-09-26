import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Code, Download, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const PythonPractice: React.FC = () => {
  const { user } = useApp();
  const [pythonCode, setPythonCode] = useState(`# Python Data Science Practice Environment
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Sample dataset
data = {
    'product': ['A', 'B', 'C', 'D', 'E'],
    'sales': [100, 150, 200, 120, 180],
    'profit': [20, 30, 45, 25, 40]
}

df = pd.DataFrame(data)
print("Sample Dataset:")
print(df.head())

# Basic analysis
print(f"\\nTotal Sales: {df['sales'].sum()}")
print(f"Average Profit: {df['profit'].mean():.2f}")
`);
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCode = async () => {
    setIsLoading(true);
    setError(null);
    setOutput('');
    
    // Simulate Python code execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mock Python execution result
      const mockOutput = `Sample Dataset:
  product  sales  profit
0       A    100      20
1       B    150      30
2       C    200      45
3       D    120      25
4       E    180      40

Total Sales: 750
Average Profit: 32.00

Execution completed successfully!
Time: 1.234s`;
      
      setOutput(mockOutput);
    } catch (err) {
      setError('Code execution failed. Please check your syntax.');
    }
    
    setIsLoading(false);
  };

  const resetNotebook = () => {
    setPythonCode(`# Python Data Science Practice Environment
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Write your code here
`);
    setOutput('');
    setError(null);
  };

  const roleColors = {
    analyst: 'from-blue-500 to-blue-600',
    scientist: 'from-purple-500 to-purple-600',
    engineer: 'from-green-500 to-green-600'
  };

  const libraries = [
    { name: 'pandas', description: 'Data manipulation and analysis', version: '1.5.3' },
    { name: 'numpy', description: 'Numerical computing', version: '1.24.3' },
    { name: 'matplotlib', description: 'Data visualization', version: '3.7.1' },
    { name: 'scikit-learn', description: 'Machine learning', version: '1.2.2' },
    { name: 'seaborn', description: 'Statistical visualization', version: '0.12.2' },
    { name: 'plotly', description: 'Interactive visualizations', version: '5.14.1' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${user ? roleColors[user.role] : 'from-purple-500 to-purple-600'} text-white p-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center">
            <Code className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Python Practice Environment</h1>
              <p className="text-purple-100">Jupyter-style notebook with data science libraries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Libraries Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold text-gray-900 mb-3">Available Libraries</h3>
              <div className="space-y-3">
                {libraries.map((lib) => (
                  <div key={lib.name} className="p-3 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-900">{lib.name}</div>
                    <div className="text-sm text-gray-600">{lib.description}</div>
                    <div className="text-xs text-gray-500 mt-1">v{lib.version}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Examples */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Quick Examples</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setPythonCode(`# Data Analysis Example
import pandas as pd
import numpy as np

# Create sample data
data = np.random.randn(100, 3)
df = pd.DataFrame(data, columns=['A', 'B', 'C'])

print("Dataset shape:", df.shape)
print("\\nDescriptive statistics:")
print(df.describe())
`)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                >
                  Data Analysis
                </button>
                <button
                  onClick={() => setPythonCode(`# Visualization Example
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.legend()
plt.grid(True)
plt.show()

print("Plot generated successfully!")
`)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                >
                  Visualization
                </button>
                <button
                  onClick={() => setPythonCode(`# Machine Learning Example
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
clf = RandomForestClassifier(random_state=42)
clf.fit(X_train, y_train)

# Make predictions
y_pred = clf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"Model accuracy: {accuracy:.3f}")
`)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                >
                  Machine Learning
                </button>
              </div>
            </div>
          </div>

          {/* Main Notebook Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Code Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Python Notebook</h3>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={resetNotebook}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </button>
                    <button
                      onClick={executeCode}
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors inline-flex items-center disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isLoading ? 'Running...' : 'Run Cell'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="border border-gray-300 rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                    <span className="text-sm text-gray-600">Cell [1]:</span>
                  </div>
                  <textarea
                    value={pythonCode}
                    onChange={(e) => setPythonCode(e.target.value)}
                    className="w-full h-64 p-4 font-mono text-sm border-0 focus:ring-0 resize-none"
                    placeholder="Write your Python code here..."
                  />
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">Output</h3>
              </div>
              
              <div className="p-4">
                {error ? (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <div className="font-medium text-red-800">Execution Error</div>
                      <div className="text-red-700">{error}</div>
                    </div>
                  </div>
                ) : output ? (
                  <div>
                    <div className="flex items-center mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <div className="font-medium text-green-800">Code executed successfully</div>
                    </div>
                    
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                      {output}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Run your Python code to see output here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kernel Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Kernel: Python 3.11</span>
                </div>
                <div className="text-sm text-gray-500">Ready for execution</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};