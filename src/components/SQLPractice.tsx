import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockDatabases } from '../data/mockData';
import { Play, Database, Table, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const SQLPractice: React.FC = () => {
  const { user } = useApp();
  const [selectedDatabase, setSelectedDatabase] = useState(mockDatabases[0]);
  const [sqlQuery, setSqlQuery] = useState('-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Mock query validation and result generation
      if (sqlQuery.toLowerCase().includes('select')) {
        if (sqlQuery.toLowerCase().includes('customers')) {
          setQueryResult({
            columns: ['customer_id', 'first_name', 'last_name', 'email', 'created_at'],
            rows: [
              [1, 'John', 'Doe', 'john@example.com', '2023-01-15'],
              [2, 'Jane', 'Smith', 'jane@example.com', '2023-02-20'],
              [3, 'Mike', 'Johnson', 'mike@example.com', '2023-03-01']
            ],
            executionTime: '0.045s',
            rowCount: 3
          });
        } else if (sqlQuery.toLowerCase().includes('orders')) {
          setQueryResult({
            columns: ['order_id', 'customer_id', 'order_date', 'total_amount'],
            rows: [
              [1, 1, '2023-03-01', 149.99],
              [2, 2, '2023-03-02', 89.50],
              [3, 1, '2023-03-05', 275.20]
            ],
            executionTime: '0.032s',
            rowCount: 3
          });
        } else {
          throw new Error('Table not found');
        }
      } else {
        throw new Error('Only SELECT queries are allowed in this sandbox');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    }
    
    setIsLoading(false);
  };

  const resetSandbox = () => {
    setSqlQuery('-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;');
    setQueryResult(null);
    setError(null);
  };

  const roleColors = {
    analyst: 'from-blue-500 to-blue-600',
    scientist: 'from-purple-500 to-purple-600',
    engineer: 'from-green-500 to-green-600'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${user ? roleColors[user.role] : 'from-blue-500 to-blue-600'} text-white p-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center">
            <Database className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">SQL Practice Environment</h1>
              <p className="text-blue-100">Interactive SQL sandbox with real datasets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Database Schema Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold text-gray-900 mb-3">Database Schema</h3>
              <div className="space-y-3">
                {mockDatabases.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => setSelectedDatabase(db)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedDatabase.id === db.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{db.name}</div>
                    <div className="text-sm text-gray-600">{db.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tables */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Tables</h3>
              <div className="space-y-2">
                {selectedDatabase.tables.map((table) => (
                  <div key={table.name} className="p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center mb-1">
                      <Table className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{table.name}</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {table.columns.map((column) => (
                        <div key={column.name} className="text-sm text-gray-600">
                          {column.name} <span className="text-gray-400">({column.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Practice Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Query Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">SQL Query Editor</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={resetSandbox}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </button>
                    <button
                      onClick={executeQuery}
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors inline-flex items-center disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isLoading ? 'Running...' : 'Run Query'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-40 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Write your SQL query here..."
                />
              </div>
            </div>

            {/* Query Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">Query Results</h3>
              </div>
              
              <div className="p-4">
                {error ? (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <div className="font-medium text-red-800">Query Error</div>
                      <div className="text-red-700">{error}</div>
                    </div>
                  </div>
                ) : queryResult ? (
                  <div>
                    <div className="flex items-center mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <div className="font-medium text-green-800">Query executed successfully</div>
                        <div className="text-green-700 text-sm">
                          {queryResult.rowCount} rows returned in {queryResult.executionTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            {queryResult.columns.map((column: string) => (
                              <th key={column} className="px-4 py-2 text-left font-medium text-gray-900 border-b">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row: any[], index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 border-b text-gray-900">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Run a query to see results here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};