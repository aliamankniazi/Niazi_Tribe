'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon,
  CameraIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const quickActions = [
  {
    name: 'Add Person',
    description: 'Add a new family member to your tree',
    href: '/tree/add-person',
    icon: PlusCircleIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Upload Media',
    description: 'Share photos and documents',
    href: '/media/upload',
    icon: CameraIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Import GEDCOM',
    description: 'Import data from other genealogy software',
    href: '/import',
    icon: DocumentTextIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'Search Records',
    description: 'Search historical records and documents',
    href: '/search',
    icon: MagnifyingGlassIcon,
    color: 'bg-indigo-500',
  },
];

type Stats = {
  people: number;
  media: number;
  dnaMatches: number;
  recentActivity: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setStats(data.data as Stats);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAuthenticated) fetchStats();
  }, [isAuthenticated]);

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">Niazi Tribe</h1>
              <nav className="ml-8 flex space-x-6">
                <Link href="/dashboard" className="text-gray-900 font-medium">Dashboard</Link>
                <Link href="/tree" className="text-gray-600 hover:text-gray-900">My Tree</Link>
                <Link href="/dna" className="text-gray-600 hover:text-gray-900">DNA</Link>
                <Link href="/search" className="text-gray-600 hover:text-gray-900">Search</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.name || user.email}!
              </span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name || 'Explorer'}!
          </h2>
          <p className="mt-2 text-gray-600">
            Start building your family tree and discover your ancestry.
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { name: 'People in Your Tree', value: stats.people, icon: UsersIcon },
              { name: 'Photos & Documents', value: stats.media, icon: CameraIcon },
              { name: 'DNA Matches', value: stats.dnaMatches, icon: BeakerIcon },
              { name: 'Recent Activity', value: stats.recentActivity, icon: ClockIcon },
            ].map((stat) => (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
              >
                <div className={`flex-shrink-0 rounded-lg p-3 ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="text-sm text-gray-500 truncate">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <div className="ml-3">
                  <p className="text-sm text-gray-900 font-medium">Add yourself to the tree</p>
                  <p className="text-sm text-gray-500">Start by creating your own profile with basic information.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <div className="ml-3">
                  <p className="text-sm text-gray-900 font-medium">Add your immediate family</p>
                  <p className="text-sm text-gray-500">Add parents, siblings, spouse, and children.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <div className="ml-3">
                  <p className="text-sm text-gray-900 font-medium">Upload photos and documents</p>
                  <p className="text-sm text-gray-500">Bring your family history to life with media.</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/tree/add-person"
                className="btn btn-primary"
              >
                Start Building Your Tree
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
