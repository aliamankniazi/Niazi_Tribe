/**
 * @jest-environment jsdom
 * @ts-nocheck
 */
import '@testing-library/jest-dom/extend-expect';
import { renderHook, act } from '@testing-library/react'
import axios from 'axios'
import { useAuthStore } from '../authStore'

// Mock axios
jest.mock('axios', () => ({
  defaults: {
    baseURL: '',
    headers: {
      common: {}
    }
  },
  post: jest.fn(),
  put: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn()
    }
  }
}))

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false
    })
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              role: 'user',
              isEmailVerified: true
            },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token'
          }
        }
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password')
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
      })

      expect(result.current.user).toEqual(mockResponse.data.data.user)
      expect(result.current.token).toBe('mock-token')
      expect(result.current.refreshToken).toBe('mock-refresh-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      }

      mockedAxios.post.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAuthStore())

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password')
        })
      ).rejects.toThrow('Invalid credentials')

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should set loading state during login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1' },
            token: 'token',
            refreshToken: 'refresh-token'
          }
        }
      }

      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('test@example.com', 'password')
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Registration successful'
        }
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuthStore())

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        username: 'johndoe',
        password: 'password123'
      }

      await act(async () => {
        await result.current.register(userData)
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', userData)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle registration failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Email already exists'
          }
        }
      }

      mockedAxios.post.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAuthStore())

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        username: 'johndoe',
        password: 'password123'
      }

      await expect(
        act(async () => {
          await result.current.register(userData)
        })
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('logout', () => {
    it('should logout and clear state', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set some initial state
      act(() => {
        useAuthStore.setState({
          user: { id: '1' } as any,
          token: 'token',
          refreshToken: 'refresh-token',
          isAuthenticated: true
        })
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.refreshToken).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('refreshAuth', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'new-token'
          }
        }
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuthStore())

      // Set initial refresh token
      act(() => {
        useAuthStore.setState({
          refreshToken: 'refresh-token'
        })
      })

      await act(async () => {
        await result.current.refreshAuth()
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'refresh-token'
      })

      expect(result.current.token).toBe('new-token')
    })

    it('should logout on refresh failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid refresh token'
          }
        }
      }

      mockedAxios.post.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAuthStore())

      // Set initial state
      act(() => {
        useAuthStore.setState({
          user: { id: '1' } as any,
          token: 'token',
          refreshToken: 'invalid-refresh-token',
          isAuthenticated: true
        })
      })

      await expect(
        act(async () => {
          await result.current.refreshAuth()
        })
      ).rejects.toThrow('Session expired. Please login again.')

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'janedoe',
        role: 'user',
        isEmailVerified: true
      }

      const mockResponse = {
        data: {
          data: updatedUser
        }
      }

      mockedAxios.put.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        useAuthStore.setState({
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            role: 'user',
            isEmailVerified: true
          }
        })
      })

      await act(async () => {
        await result.current.updateProfile({ firstName: 'Jane' })
      })

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/auth/profile', { firstName: 'Jane' })
      expect(result.current.user).toEqual(updatedUser)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Email verified successfully'
        }
      }

      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuthStore())

      // Set initial user with unverified email
      act(() => {
        useAuthStore.setState({
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            role: 'user',
            isEmailVerified: false
          }
        })
      })

      await act(async () => {
        await result.current.verifyEmail('verification-token')
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/verify-email', {
        token: 'verification-token'
      })

      expect(result.current.user?.isEmailVerified).toBe(true)
    })
  })
}) 