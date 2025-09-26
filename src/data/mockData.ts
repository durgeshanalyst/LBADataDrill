import { Challenge, Badge, Database, LearningPath } from '../types';

export const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Basic SELECT Queries',
    description: 'Learn the fundamentals of selecting data from database tables',
    difficulty: 'beginner',
    type: 'sql',
    roles: ['analyst', 'scientist', 'engineer'],
    category: 'SQL Fundamentals',
    xpReward: 100,
    completed: false,
    testCases: [
      {
        input: 'SELECT * FROM customers LIMIT 10;',
        expectedOutput: '10 rows returned',
        description: 'Select first 10 customers'
      }
    ]
  },
  {
    id: '2',
    title: 'Data Filtering with WHERE',
    description: 'Master conditional data filtering techniques',
    difficulty: 'beginner',
    type: 'sql',
    roles: ['analyst', 'scientist', 'engineer'],
    category: 'SQL Fundamentals',
    xpReward: 150,
    completed: false
  },
  {
    id: '3',
    title: 'Pandas Data Manipulation',
    description: 'Learn essential Pandas operations for data analysis',
    difficulty: 'intermediate',
    type: 'python',
    roles: ['scientist', 'engineer'],
    category: 'Python Data Science',
    xpReward: 200,
    completed: false
  },
  {
    id: '4',
    title: 'Advanced JOINs',
    description: 'Master complex table relationships and join operations',
    difficulty: 'advanced',
    type: 'sql',
    roles: ['analyst', 'scientist', 'engineer'],
    category: 'Advanced SQL',
    xpReward: 300,
    completed: false
  },
  {
    id: '5',
    title: 'Machine Learning with Scikit-learn',
    description: 'Build your first ML model using scikit-learn',
    difficulty: 'advanced',
    type: 'python',
    roles: ['scientist'],
    category: 'Machine Learning',
    xpReward: 400,
    completed: false
  }
];

export const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'SQL Novice',
    description: 'Complete your first SQL challenge',
    icon: 'Database',
    color: 'blue',
    earned: false
  },
  {
    id: '2',
    name: 'Python Pioneer',
    description: 'Complete your first Python challenge',
    icon: 'Code',
    color: 'green',
    earned: false
  },
  {
    id: '3',
    name: 'Data Detective',
    description: 'Complete 10 challenges',
    icon: 'Search',
    color: 'purple',
    earned: false
  },
  {
    id: '4',
    name: 'Challenge Master',
    description: 'Complete 50 challenges',
    icon: 'Trophy',
    color: 'gold',
    earned: false
  }
];

export const mockDatabases: Database[] = [
  {
    id: 'retail',
    name: 'E-commerce Retail',
    description: 'Complete e-commerce dataset with customers, orders, and products',
    tables: [
      {
        name: 'customers',
        columns: [
          { name: 'customer_id', type: 'INTEGER', nullable: false },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'email', type: 'VARCHAR(100)', nullable: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false }
        ],
        data: [
          { customer_id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', created_at: '2023-01-15' },
          { customer_id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', created_at: '2023-02-20' }
        ]
      },
      {
        name: 'orders',
        columns: [
          { name: 'order_id', type: 'INTEGER', nullable: false },
          { name: 'customer_id', type: 'INTEGER', nullable: false },
          { name: 'order_date', type: 'DATE', nullable: false },
          { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false }
        ],
        data: [
          { order_id: 1, customer_id: 1, order_date: '2023-03-01', total_amount: 149.99 },
          { order_id: 2, customer_id: 2, order_date: '2023-03-02', total_amount: 89.50 }
        ]
      }
    ]
  },
  {
    id: 'banking',
    name: 'Banking & Finance',
    description: 'Banking transactions and account management data',
    tables: [
      {
        name: 'accounts',
        columns: [
          { name: 'account_id', type: 'INTEGER', nullable: false },
          { name: 'account_number', type: 'VARCHAR(20)', nullable: false },
          { name: 'balance', type: 'DECIMAL(15,2)', nullable: false },
          { name: 'account_type', type: 'VARCHAR(20)', nullable: false }
        ],
        data: [
          { account_id: 1, account_number: 'ACC001', balance: 5000.00, account_type: 'Checking' },
          { account_id: 2, account_number: 'ACC002', balance: 15000.00, account_type: 'Savings' }
        ]
      }
    ]
  }
];

export const learningPaths: LearningPath[] = [
  {
    role: 'analyst',
    title: 'Data Analyst Path',
    description: 'Master SQL queries, data visualization, and business intelligence',
    modules: [
      {
        id: 'sql-basics',
        title: 'SQL Fundamentals',
        description: 'Learn basic SQL operations and queries',
        challenges: ['1', '2'],
        unlocked: true
      },
      {
        id: 'advanced-sql',
        title: 'Advanced SQL',
        description: 'Master complex queries and optimizations',
        challenges: ['4'],
        unlocked: false
      }
    ]
  },
  {
    role: 'scientist',
    title: 'Data Scientist Path',
    description: 'Master Python, machine learning, and statistical analysis',
    modules: [
      {
        id: 'python-basics',
        title: 'Python for Data Science',
        description: 'Learn Python libraries for data manipulation',
        challenges: ['3'],
        unlocked: true
      },
      {
        id: 'machine-learning',
        title: 'Machine Learning',
        description: 'Build and deploy ML models',
        challenges: ['5'],
        unlocked: false
      }
    ]
  },
  {
    role: 'engineer',
    title: 'Data Engineer Path',
    description: 'Master ETL pipelines, database optimization, and big data tools',
    modules: [
      {
        id: 'sql-optimization',
        title: 'SQL & Database Optimization',
        description: 'Optimize queries and database performance',
        challenges: ['4'],
        unlocked: true
      },
      {
        id: 'etl-pipelines',
        title: 'ETL Pipeline Development',
        description: 'Build robust data pipelines',
        challenges: ['3'],
        unlocked: true
      }
    ]
  }
];