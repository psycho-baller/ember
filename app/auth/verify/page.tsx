'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FloatingBlobs from '@/components/landing/FloatingBlobs';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  // Auto-verify when component mounts
  useEffect(() => {
    verifyEmail();
  }, [token_hash, type, next, router]);

  const verifyEmail = () => {
    try {
      if (token_hash && type) {
        router.replace(`/auth/confirm?${new URLSearchParams({
          token_hash,
          type,
          next
        })}`);
      } else {
        throw new Error('Missing required parameters');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed', {
        description: 'Unable to verify your email. Please try again later.',
      });
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <FloatingBlobs />
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">
          Waking up Ember🥱
        </h1>
        <p className="text-muted-foreground mb-8">
          Can't wait to meet you!
        </p>
        <div className="relative flex justify-center items-center h-14 w-14 mx-auto my-6">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent"></div>
      </div>
    }>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <VerifyEmailContent />
      </div>
    </Suspense>
  );
}
