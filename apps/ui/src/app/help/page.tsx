'use client';

import { useState } from 'react';

const helpTopics = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `
      Welcome to Niazi Tribe! Here's how to get started:
      
      1. Create an account or sign in
      2. Start your family tree by adding yourself
      3. Add your immediate family members
      4. Begin exploring and expanding your tree
      
      For more detailed instructions, check out our Quick Start Guide below.
    `
  },
  {
    id: 'building-tree',
    title: 'Building Your Family Tree',
    content: `
      To build your family tree:
      
      1. Click "Add Family Member" from your tree view
      2. Fill in the person's details (name, birth date, etc.)
      3. Select their relationship to existing family members
      4. Add photos and documents (optional)
      5. Save the new family member
      
      You can edit or remove family members at any time.
    `
  },
  {
    id: 'privacy',
    title: 'Privacy Settings',
    content: `
      Protect your family's privacy:
      
      1. Go to Settings > Privacy
      2. Choose who can view your tree
      3. Set individual privacy levels for family members
      4. Control who can make changes to your tree
      5. Manage your sharing settings
    `
  },
  {
    id: 'research',
    title: 'Research Tools',
    content: `
      Use our research tools to discover more:
      
      1. Search historical records
      2. Browse public family trees
      3. Use DNA matching (coming soon)
      4. Access newspaper archives
      5. Find birth, marriage, and death records
    `
  },
  {
    id: 'sharing',
    title: 'Sharing and Collaboration',
    content: `
      Work together with family members:
      
      1. Invite relatives to view your tree
      2. Set permission levels for collaborators
      3. Share discoveries and documents
      4. Comment and discuss findings
      5. Export and share your family tree
    `
  }
];

export default function HelpPage() {
  const [selectedTopic, setSelectedTopic] = useState(helpTopics[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Help Center</h1>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search help topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  selectedTopic.id === topic.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {topic.title}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{selectedTopic.title}</h2>
            <div className="prose max-w-none">
              {selectedTopic.content.split('\n').map((line, index) => (
                <p key={index} className="mb-4">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Still need help?</h3>
            <p className="text-gray-600">
              Contact our support team at{' '}
              <a href="mailto:support@niazitribe.com" className="text-blue-500 hover:text-blue-600">
                support@niazitribe.com
              </a>
              {' '}or visit our{' '}
              <a href="/community" className="text-blue-500 hover:text-blue-600">
                community forums
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 