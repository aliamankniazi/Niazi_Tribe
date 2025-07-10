'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch {
      // If reset fails, redirect to home page
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-6xl font-bold text-gray-900">Oops!</h1>
        <p className="mt-4 text-xl text-gray-600">
          {error.message || 'Something went wrong'}
        </p>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="mt-2 text-sm text-gray-500">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 space-x-4">
          <button
            onClick={handleReset}
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/')}
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
} 