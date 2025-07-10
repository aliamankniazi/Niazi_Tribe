'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Person } from '@/types/person';

export default function PersonPage() {
  const params = useParams();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerson = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/persons/${params.id}`);
      setPerson(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load person');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

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

  if (!person) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h1 className="text-3xl font-bold">{person.first_name} {person.last_name}</h1>
          {person.occupation && (
            <p className="text-gray-600 mt-1">{person.occupation}</p>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <dl className="space-y-3">
                {person.birth_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Birth Date</dt>
                    <dd className="mt-1">{new Date(person.birth_date).toLocaleDateString()}</dd>
                  </div>
                )}
                {person.birth_place && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Birth Place</dt>
                    <dd className="mt-1">{person.birth_place}</dd>
                  </div>
                )}
                {person.death_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Death Date</dt>
                    <dd className="mt-1">{new Date(person.death_date).toLocaleDateString()}</dd>
                  </div>
                )}
                {person.death_place && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Death Place</dt>
                    <dd className="mt-1">{person.death_place}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 capitalize">{person.gender}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Biography</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{person.bio || 'No biography available.'}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Family Connections</h2>
            <FamilyConnections personId={person.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FamilyConnections({ personId }: { personId: string }) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/persons/${personId}/family-connections`, {
        params: { page, limit: 10 }
      });
      setConnections(prev => page === 1 ? data.data : [...prev, ...data.data]);
      setHasMore(data.meta.has_more);
    } catch (error) {
      console.error('Failed to load family connections:', error);
    } finally {
      setLoading(false);
    }
  }, [personId, page]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  if (loading && page === 1) {
    return <div className="text-center py-4">Loading connections...</div>;
  }

  return (
    <div className="space-y-4">
      {connections.length === 0 ? (
        <p className="text-gray-600">No family connections found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <div key={connection.id} className="border rounded p-4">
                <h3 className="font-semibold">
                  {connection.person1.first_name} {connection.person1.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {connection.relationship_type}
                </p>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
} 