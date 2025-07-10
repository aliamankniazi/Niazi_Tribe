'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { 
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { User } from 'next-auth';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTrees: number;
  totalMedia: number;
  storageUsed: string;
  lastBackup: string;
}

interface AdminUser extends User {
  role: string;
  createdAt: string;
  lastLogin: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading_stats, setIsLoadingStats] = useState(true);
  const [isLoading_users, setIsLoadingUsers] = useState(true);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTrees: 0,
    totalMedia: 0,
    storageUsed: '0 MB',
    lastBackup: 'Never'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch('/api/admin/stats', {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Failed to load system statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await fetch('/api/admin/users', {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load user data');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      fetchStats();
      if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [isAuthenticated, user, activeTab]);

  const handleQuickAction = async (action: string) => {
    try {
      setIsPerformingAction(true);
      const response = await fetch(`/api/admin/actions/${action}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Failed to perform ${action}`);

      toast.success(`Successfully performed ${action}`);
      
      // Refresh stats after action
      const statsResponse = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      if (statsResponse.ok) {
        const newStats = await statsResponse.json();
        setStats(newStats);
      }
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
      toast.error(`Failed to perform ${action}`);
    } finally {
      setIsPerformingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'logs', name: 'Activity Logs', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">Niazi Tribe Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  useAuthStore.getState().logout();
                  router.push('/');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Admin Access</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You are viewing the admin panel. Changes made here affect all users.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading_stats ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UsersIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UsersIcon className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Storage Used</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{stats.storageUsed}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <button 
                    className="btn btn-outline flex items-center justify-center"
                    onClick={() => handleQuickAction('backup')}
                    disabled={isPerformingAction}
                  >
                    <CloudArrowDownIcon className="h-5 w-5 mr-2" />
                    Backup Database
                  </button>
                  <button 
                    className="btn btn-outline flex items-center justify-center"
                    onClick={() => handleQuickAction('export')}
                    disabled={isPerformingAction}
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Export User Data
                  </button>
                  <button 
                    className="btn btn-outline flex items-center justify-center"
                    onClick={() => handleQuickAction('clear-cache')}
                    disabled={isPerformingAction}
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <button className="btn btn-primary">Add User</button>
              </div>
              
              {isLoading_users ? (
                <div className="animate-pulse space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.lastLogin).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">Site Name</label>
                  <input 
                    type="text" 
                    id="siteName"
                    name="siteName"
                    aria-label="Site Name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
                    defaultValue="Niazi Tribe" 
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input 
                    type="email" 
                    id="contactEmail"
                    name="contactEmail"
                    aria-label="Contact Email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
                    defaultValue="admin@niazitribe.com" 
                  />
                </div>
                <div>
                  <label htmlFor="uploadLimit" className="block text-sm font-medium text-gray-700">File Upload Limit (MB)</label>
                  <input 
                    type="number" 
                    id="uploadLimit"
                    name="uploadLimit"
                    aria-label="File Upload Limit in Megabytes"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
                    defaultValue="50" 
                  />
                </div>
                <div className="pt-5">
                  <button className="btn btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button className="btn btn-outline">Enable 2FA</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Session Management</h4>
                    <p className="text-sm text-gray-500">Manage active sessions and force logout</p>
                  </div>
                  <button className="btn btn-outline">View Sessions</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">API Access</h4>
                    <p className="text-sm text-gray-500">Manage API keys and access tokens</p>
                  </div>
                  <button className="btn btn-outline">Manage Keys</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
                <div className="flex space-x-2">
                  <div>
                    <label htmlFor="eventFilter" className="sr-only">Filter Events</label>
                    <select 
                      id="eventFilter"
                      name="eventFilter"
                      aria-label="Filter Events"
                      className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option>All Events</option>
                      <option>User Events</option>
                      <option>System Events</option>
                      <option>Security Events</option>
                    </select>
                  </div>
                  <button className="btn btn-outline">Export Logs</button>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">Activity logs will be implemented in the next update...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
