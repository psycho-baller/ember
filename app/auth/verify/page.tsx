'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FloatingBlobs from '@/components/landing/FloatingBlobs';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  // Auto-redirect if the page is accessed directly with the token
  useEffect(() => {
    handleClick();
  }, []);

  const handleClick = () => {
    if (token_hash && type) {
      window.location.href = `/auth/confirm?${new URLSearchParams({
        token_hash,
        type,
        next
      })}`;
    } else {
      toast.error('Invalid token', {
        description: 'Please try logging in again.',
      });
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <FloatingBlobs />
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">
          Verify Your Email
        </h1>
        <p className="text-muted-foreground mb-8">
          Click the button below to complete your sign-in process.
        </p>
        <div className="w-full">
          <Button
            onClick={handleClick}
            className="w-full py-6 text-lg"
          >
            Confirm email
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent"></div>
      </div>
    }>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <VerifyEmailContent />
      </div>
    </Suspense>
  );
}
