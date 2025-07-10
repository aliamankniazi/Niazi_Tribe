'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfileData(res.data.data.user);
      } catch (err: any) {
        console.error('Failed to load profile', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gray-200"></div>
            <div>
              <h2 className="text-xl font-semibold">{profileData?.name || session?.user?.name}</h2>
              <p className="text-gray-600">{profileData?.email || session?.user?.email}</p>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
            {/* Add more profile fields here */}
          </div>
        </div>
      </div>
    </div>
  );
} 