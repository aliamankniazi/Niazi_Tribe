'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const settingsSchema = z.object({
  emailNotifications: z.object({
    connections: z.boolean(),
    updates: z.boolean(),
    messages: z.boolean(),
  }),
  language: z.enum(['English','Spanish','French']),
  profileVisibility: z.enum(['Public','Private','Friends Only']),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailNotifications: {
        connections: true,
        updates: true,
        messages: true,
      },
      language: 'English',
      profileVisibility: 'Public',
    }
  });

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    
    try {
      await api.put('/users/profile', data);
      setNotification({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {notification.message && (
        <div className={`p-4 mb-6 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Notifications
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300" {...register('emailNotifications.connections')} />
                    <span className="ml-2">New family connections</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300" {...register('emailNotifications.updates')} />
                    <span className="ml-2">Tree updates</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300" {...register('emailNotifications.messages')} />
                    <span className="ml-2">Messages</span>
                  </label>
                </div>
                {errors.emailNotifications?.connections && (
                  <p className="text-red-500 text-sm mt-1">{errors.emailNotifications.connections.message}</p>
                )}
                {errors.emailNotifications?.updates && (
                  <p className="text-red-500 text-sm mt-1">{errors.emailNotifications.updates.message}</p>
                )}
                {errors.emailNotifications?.messages && (
                  <p className="text-red-500 text-sm mt-1">{errors.emailNotifications.messages.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select {...register('language')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
                {errors.language && (
                  <p className="text-red-500 text-sm">{errors.language.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Visibility
                </label>
                <select {...register('profileVisibility')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Friends Only">Friends Only</option>
                </select>
                {errors.profileVisibility && (
                  <p className="text-red-500 text-sm">{errors.profileVisibility.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 