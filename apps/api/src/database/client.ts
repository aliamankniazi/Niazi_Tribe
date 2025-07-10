interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  lastLogin: Date | null;
}

interface SystemLog {
  id: number;
  type: string;
  message: string;
  createdAt: Date;
}

interface QueryResult {
  count: number;
}

// TODO: Replace with actual database client implementation
export const dbClient = {
  query: async <T = QueryResult[]>(sql: string, params?: any[]): Promise<T> => {
    return [] as unknown as T;
  },
  
  transaction: async <T>(callback: () => Promise<T>): Promise<T> => {
    return callback();
  },

  user: {
    findMany: async (): Promise<User[]> => {
      return [];
    }
  },

  systemLog: {
    create: async (data: { data: Partial<SystemLog> }): Promise<SystemLog> => {
      return {
        id: 1,
        type: data.data.type || '',
        message: data.data.message || '',
        createdAt: new Date()
      };
    }
  }
};

export default dbClient; 