import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Person, PersonFilters, PaginatedResponse } from '@/types/person';
import api from '@/lib/api';

export default function PersonSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PersonFilters>({
    page: 1,
    limit: 10
  });
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const searchPersons = useCallback(async (resetPage = true) => {
    try {
      setLoading(true);
      const searchFilters = {
        ...filters,
        search: searchTerm,
        page: resetPage ? 1 : filters.page
      };

      const { data } = await api.get<PaginatedResponse<Person>>('/persons', {
        params: searchFilters
      });

      setResults(prev => resetPage ? data.data : [...prev, ...data.data]);
      setHasMore(data.meta.has_more);
      
      if (resetPage) {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchPersons(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchPersons]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setFilters(prev => ({ ...prev, page: prev.page + 1 }));
      searchPersons(false);
    }
  };

  const handleDateFilter = (type: 'birth_date' | 'death_date', value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex space-x-4">
          <input
            type="date"
            value={filters.birth_date || ''}
            onChange={(e) => handleDateFilter('birth_date', e.target.value)}
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Birth date"
          />
          <input
            type="date"
            value={filters.death_date || ''}
            onChange={(e) => handleDateFilter('death_date', e.target.value)}
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Death date"
          />
        </div>
      </div>

      {loading && results.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((person) => (
            <div
              key={person.id}
              onClick={() => router.push(`/person/${person.id}`)}
              className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <h3 className="font-semibold text-lg">
                {person.first_name} {person.last_name}
              </h3>
              {person.birth_date && (
                <p className="text-sm text-gray-600">
                  Born: {new Date(person.birth_date).toLocaleDateString()}
                  {person.birth_place && ` in ${person.birth_place}`}
                </p>
              )}
              {person.occupation && (
                <p className="text-sm text-gray-600">
                  Occupation: {person.occupation}
                </p>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}

          {!loading && results.length === 0 && (
            <p className="text-center text-gray-600 py-8">
              No results found. Try adjusting your search terms.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 