'use client';

import PersonSearch from '@/components/search/PersonSearch';

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search People</h1>
      <PersonSearch />
    </div>
  );
} 