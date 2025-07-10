'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthDate?: string;
  birthPlace?: string;
  imageUrl?: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  description?: string;
  members: FamilyMember[];
  events: {
    id: string;
    type: string;
    date: string;
    place: string;
    description: string;
  }[];
}

export default function FamilyGroupPage() {
  const params = useParams();
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamilyGroup = async () => {
      try {
        const { data } = await api.get(`/relationships/family/${params.id}`);
        setFamilyGroup(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load family group');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyGroup();
  }, [params.id]);

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

  if (!familyGroup) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h1 className="text-3xl font-bold">{familyGroup.name}</h1>
          {familyGroup.description && (
            <p className="mt-2 text-gray-600">{familyGroup.description}</p>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Family Members</h2>
              <div className="space-y-4">
                {familyGroup.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex-shrink-0">
                      {member.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/person/${member.id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-800"
                      >
                        {member.name}
                      </Link>
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                      {member.birthDate && (
                        <p className="text-sm text-gray-500">
                          Born: {member.birthDate}
                          {member.birthPlace && ` in ${member.birthPlace}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Family Events</h2>
              <div className="space-y-4">
                {familyGroup.events.map((event) => (
                  <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">{event.type}</h3>
                    <p className="text-sm text-gray-600">
                      {event.date} • {event.place}
                    </p>
                    <p className="mt-2 text-gray-700">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Family Documents</h2>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600">
                No documents uploaded yet.{' '}
                <button className="text-blue-500 hover:text-blue-600">
                  Upload a document
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 