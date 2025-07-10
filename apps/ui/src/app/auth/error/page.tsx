'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const getErrorMessage = (error: string | null): string => {
  switch (error) {
    case 'Configuration':
      return 'There is a problem with the server configuration.';
    case 'AccessDenied':
      return 'You do not have permission to access this resource.';
    case 'Verification':
      return 'The verification link may have expired or already been used.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'EmailCreateAccount':
    case 'Callback':
      return 'There was a problem with the authentication service.';
    case 'OAuthAccountNotLinked':
      return 'To confirm your identity, sign in with the same account you used originally.';
    case 'EmailSignin':
      return 'The e-mail could not be sent.';
    case 'CredentialsSignin':
      return 'Invalid email or password.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    default:
      return 'An unexpected error occurred.';
  }
};

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('Auth error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-gray-900">Authentication Error</h1>
        <p className="mt-4 text-xl text-gray-600">
          {getErrorMessage(error)}
        </p>
        <div className="mt-8 space-x-4">
          <button
            onClick={() => router.push('/login')}
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Login
          </button>
          <button
            onClick={() => router.push('/')}
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
} 