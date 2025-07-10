import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock Redis for tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    setex: jest.fn().mockResolvedValue('OK'),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
  }));
});

// Mock Neo4j driver for tests
jest.mock('neo4j-driver', () => ({
  driver: jest.fn().mockReturnValue({
    session: jest.fn().mockReturnValue({
      run: jest.fn().mockResolvedValue({
        records: [],
        summary: {}
      }),
      close: jest.fn().mockResolvedValue(undefined)
    }),
    close: jest.fn().mockResolvedValue(undefined)
  }),
  auth: {
    basic: jest.fn().mockReturnValue({}),
  },
}));

// Mock AWS S3 for tests
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://mock-s3-url.com/file.jpg',
        Bucket: 'test-bucket',
        Key: 'test-key',
        ETag: 'mock-etag'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://mock-signed-url.com')
  }))
}));

// Mock nodemailer for tests
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'mock-message-id',
      response: '250 OK'
    })
  })
}));

// Mock amqplib for tests
jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn().mockReturnValue(true),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    }),
    close: jest.fn().mockResolvedValue(undefined)
  })
}));

// Global test setup
beforeAll(async () => {
  // Any global setup needed for tests
});

afterAll(async () => {
  // Any global cleanup needed after tests
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  role: 'user',
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockPerson = (overrides = {}) => ({
  id: 'test-person-id',
  firstName: 'Jane',
  lastName: 'Smith',
  birthDate: '1990-01-01',
  gender: 'female',
  isPrivate: false,
  createdBy: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockJWT = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return {
    ...defaultPayload,
    ...payload
  };
}; 