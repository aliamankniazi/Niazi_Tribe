import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SearchResult } from '@/types';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchPersons = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const personsRef = collection(db, 'persons');
        const searchTermLower = searchTerm.toLowerCase();
        
        // Search by name or lastName
        const nameQuery = query(
          personsRef,
          where('name', '>=', searchTermLower),
          where('name', '<=', searchTermLower + '\uf8ff')
        );

        const lastNameQuery = query(
          personsRef,
          where('lastName', '>=', searchTermLower),
          where('lastName', '<=', searchTermLower + '\uf8ff')
        );

        const [nameSnapshot, lastNameSnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(lastNameQuery)
        ]);

        const results = new Map<string, SearchResult>();

        // Process name results
        nameSnapshot.docs.forEach(doc => {
          const data = doc.data();
          results.set(doc.id, {
            id: doc.id,
            name: data.name,
            lastName: data.lastName,
            photoUrl: data.photoUrl,
            birthYear: data.dob?.split('-')[0],
            deathYear: data.dod?.split('-')[0],
            relations: {
              parents: [],
              spouses: [],
              children: []
            }
          });
        });

        // Add lastName results
        lastNameSnapshot.docs.forEach(doc => {
          if (!results.has(doc.id)) {
            const data = doc.data();
            results.set(doc.id, {
              id: doc.id,
              name: data.name,
              lastName: data.lastName,
              photoUrl: data.photoUrl,
              birthYear: data.dob?.split('-')[0],
              deathYear: data.dod?.split('-')[0],
              relations: {
                parents: [],
                spouses: [],
                children: []
              }
            });
          }
        });

        setResults(Array.from(results.values()));
      } catch (error) {
        console.error('Error searching persons:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchPersons, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => navigate(`/person/${result.id}`)}
            >
              <div className="flex items-center space-x-4">
                {result.photoUrl ? (
                  <img
                    src={result.photoUrl}
                    alt={result.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {result.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium">
                    {result.name} {result.lastName}
                  </div>
                  {(result.birthYear || result.deathYear) && (
                    <div className="text-sm text-gray-500">
                      {result.birthYear || '?'} - {result.deathYear || 'Present'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 