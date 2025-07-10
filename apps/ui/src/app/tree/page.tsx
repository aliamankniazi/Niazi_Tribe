'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { 
  PlusCircleIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { FamilyTreeViewer } from '@/components/tree/FamilyTreeViewer';
import { AppPerson, ApiPerson, transformPerson } from '@/lib/transformers';
import { Relationship } from '@/types/relationship';
import { PersonDetailsModal } from '@/components/tree/PersonDetailsModal';
import echo from '@/lib/echo';

export default function TreePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [treeData, setTreeData] = useState<AppPerson[] | null>(null);
  const [relationships, setRelationships] = useState<Relationship[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const fetchTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [personsResponse, relationshipsResponse] = await Promise.all([
        api.get('/persons'),
        api.get('/relationships')
      ]);
      
      const transformedData = (personsResponse.data.data as ApiPerson[]).map(transformPerson);
      setTreeData(transformedData);
      setRelationships(relationshipsResponse.data.data as Relationship[]);
    } catch (error: any) {
      console.error('Failed to fetch tree data:', error);
      toast.error('Could not load your family tree.');
      setError('There was a problem loading your family tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTreeData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user || !echo) return;

    const channel = echo.private(`tree.${user.id}`);

    channel.listen('.PersonUpdated', (e: any) => {
      console.log('PersonUpdated event received:', e);
      toast(e.message || 'The family tree has been updated.', {
        icon: 'ℹ️',
      });
      fetchTreeData();
    });

    return () => {
      channel.stopListening('.PersonUpdated');
      echo?.leaveChannel(`tree.${user.id}`);
    };
  }, [isAuthenticated, user]);

  const handleExport = async () => {
    try {
      const response = await api.get('/gedcom/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'export.ged');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('GEDCOM file exported successfully.');
    } catch (error) {
      console.error('Failed to export GEDCOM file:', error);
      toast.error('Could not export your family tree.');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="loading-spinner-lg mb-4"></div>
        <p className="text-gray-600">Loading your family tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Something went wrong</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchTreeData}
              className="btn btn-primary"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel + 10, 150));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel - 10, 50));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">Niazi Tribe</h1>
              <nav className="ml-8 flex space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link href="/tree" className="text-gray-900 font-medium">My Tree</Link>
                <Link href="/dna" className="text-gray-600 hover:text-gray-900">DNA</Link>
                <Link href="/search" className="text-gray-600 hover:text-gray-900">Search</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Toolbar and Tree Canvas */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 z-10">
          <div className="max-w-full mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedPersonId('new')}
                className="btn btn-primary btn-sm flex items-center"
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                Add Person
              </button>
              <button
                onClick={handleExport}
                className="btn btn-outline btn-sm flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>

            {/* Search and Zoom (simplified for brevity) */}
          </div>
        </div>

        {/* Tree Canvas */}
        <div className="flex-1 overflow-auto p-4 relative">
          {treeData && relationships && treeData.length > 0 ? (
            <FamilyTreeViewer people={treeData} relationships={relationships} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Your Family Tree is Empty</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Begin your genealogy journey by adding the first person to your tree.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setSelectedPersonId('new')}
                    className="btn btn-primary btn-lg"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add First Person
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {selectedPersonId && (
        <PersonDetailsModal
          personId={selectedPersonId}
          isOpen={!!selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          onSave={() => {
            fetchTreeData();
            setSelectedPersonId(null);
          }}
        />
      )}

      {/* Stats Bar */}
      <div className="bg-white border-t px-4 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between text-sm text-gray-600">
          <div>
            {treeData?.length} {treeData?.length === 1 ? 'person' : 'people'} in your tree
          </div>
          <div className="flex items-center space-x-4">
            <span>0 photos</span>
            <span>0 documents</span>
            <span>0 stories</span>
          </div>
        </div>
      </div>
    </div>
  );
}
