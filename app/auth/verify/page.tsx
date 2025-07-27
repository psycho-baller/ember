'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  // Auto-redirect if the page is accessed directly with the token
  useEffect(() => {
    if (token_hash && type) {
      // If the token is already in the URL, redirect to the confirm endpoint
      window.location.href = `/auth/confirm?${new URLSearchParams({
        token_hash,
        type,
        next
      })}`;
    }
  }, [token_hash, type, next]);

  const handleClick = () => {
    if (token_hash && type) {
      window.location.href = `/auth/confirm?${new URLSearchParams({
        token_hash,
        type,
        next
      })}`;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to complete your sign-in process.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={handleClick}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continue to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
