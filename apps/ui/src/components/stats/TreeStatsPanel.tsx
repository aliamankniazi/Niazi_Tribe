import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import type { TreeStats, Person } from '@/types';

export default function TreeStatsPanel() {
  const [stats, setStats] = useState<TreeStats>({
    totalPersons: 0,
    generations: 0,
    commonLastNames: [],
    genderDistribution: { male: 0, female: 0, other: 0 },
    birthYearDistribution: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch all persons for the current user
        const personsRef = collection(db, 'persons');
        const q = query(personsRef, where('uid', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        const persons = snapshot.docs.map(doc => doc.data() as Person);

        // Calculate total persons
        const totalPersons = persons.length;

        // Calculate gender distribution
        const genderDistribution = persons.reduce(
          (acc, person) => {
            const gender = person.gender || 'other';
            acc[gender]++;
            return acc;
          },
          { male: 0, female: 0, other: 0 }
        );

        // Calculate common last names
        const lastNameCount = persons.reduce((acc, person) => {
          if (person.lastName) {
            acc[person.lastName] = (acc[person.lastName] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const commonLastNames = Object.entries(lastNameCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        // Calculate birth year distribution
        const birthYearDistribution = persons.reduce((acc, person) => {
          if (person.dob) {
            const year = person.dob.split('-')[0];
            acc[year] = (acc[year] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        // Calculate average lifespan
        const lifespans = persons
          .filter(person => person.dob && person.dod)
          .map(person => {
            const birth = new Date(person.dob!).getFullYear();
            const death = new Date(person.dod!).getFullYear();
            return death - birth;
          });

        const averageLifespan = lifespans.length
          ? Math.round(lifespans.reduce((a, b) => a + b, 0) / lifespans.length)
          : undefined;

        // Calculate generations
        const generations = calculateGenerations(persons);

        setStats({
          totalPersons,
          generations,
          commonLastNames,
          averageLifespan,
          genderDistribution,
          birthYearDistribution,
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, []);

  // Helper function to calculate generations
  const calculateGenerations = (persons: Person[]): number => {
    const visited = new Set<string>();
    let maxGenerations = 0;

    const calculateDepth = (personId: string, depth: number) => {
      if (visited.has(personId)) return depth;
      visited.add(personId);

      const person = persons.find(p => p.id === personId);
      if (!person) return depth;

      const childrenDepths = person.children.map(childId =>
        calculateDepth(childId, depth + 1)
      );

      return Math.max(depth, ...childrenDepths);
    };

    // Find root nodes (persons without parents)
    const roots = persons.filter(p => p.parents.length === 0);
    roots.forEach(root => {
      const generations = calculateDepth(root.id, 1);
      maxGenerations = Math.max(maxGenerations, generations);
    });

    return maxGenerations;
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Family Tree Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Stats */}
        <div>
          <h3 className="text-lg font-medium mb-3">Overview</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-gray-500">Total Persons</dt>
              <dd className="text-2xl font-bold text-indigo-600">
                {stats.totalPersons}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Generations</dt>
              <dd className="text-2xl font-bold text-indigo-600">
                {stats.generations}
              </dd>
            </div>
            {stats.averageLifespan && (
              <div>
                <dt className="text-gray-500">Average Lifespan</dt>
                <dd className="text-2xl font-bold text-indigo-600">
                  {stats.averageLifespan} years
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Gender Distribution */}
        <div>
          <h3 className="text-lg font-medium mb-3">Gender Distribution</h3>
          <dl className="space-y-2">
            <div className="flex items-center">
              <dt className="text-gray-500 w-20">Male</dt>
              <dd className="flex-1">
                <div className="h-4 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(stats.genderDistribution.male / stats.totalPersons) * 100}%`,
                    }}
                  ></div>
                </div>
              </dd>
              <span className="ml-2 text-gray-600">
                {stats.genderDistribution.male}
              </span>
            </div>
            <div className="flex items-center">
              <dt className="text-gray-500 w-20">Female</dt>
              <dd className="flex-1">
                <div className="h-4 bg-pink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500"
                    style={{
                      width: `${(stats.genderDistribution.female / stats.totalPersons) * 100}%`,
                    }}
                  ></div>
                </div>
              </dd>
              <span className="ml-2 text-gray-600">
                {stats.genderDistribution.female}
              </span>
            </div>
            <div className="flex items-center">
              <dt className="text-gray-500 w-20">Other</dt>
              <dd className="flex-1">
                <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${(stats.genderDistribution.other / stats.totalPersons) * 100}%`,
                    }}
                  ></div>
                </div>
              </dd>
              <span className="ml-2 text-gray-600">
                {stats.genderDistribution.other}
              </span>
            </div>
          </dl>
        </div>
      </div>

      {/* Common Last Names */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Most Common Last Names</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.commonLastNames.map(({ name, count }) => (
            <div
              key={name}
              className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
            >
              <span className="font-medium">{name}</span>
              <span className="text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Birth Year Distribution */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Birth Year Distribution</h3>
        <div className="h-40 flex items-end space-x-1">
          {Object.entries(stats.birthYearDistribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([year, count]) => {
              const height = (count / Math.max(...Object.values(stats.birthYearDistribution))) * 100;
              return (
                <div
                  key={year}
                  className="flex-1 bg-indigo-100 hover:bg-indigo-200 transition-colors relative group"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    {year}: {count}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
} 