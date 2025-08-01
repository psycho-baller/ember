'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FloatingBlobs from '@/components/landing/FloatingBlobs';
import dynamic from 'next/dynamic';

const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false,
});

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  // Set window size for confetti
  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-verify when component mounts
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 2500); // Show confetti for 5 seconds
    verifyEmail();

    return () => clearTimeout(timer);
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
    <div className="w-full max-w-md px-4 relative">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}
      <FloatingBlobs />
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">
          Waking up Ember...
        </h1>
        <p className="text-muted-foreground mb-8">

        </p>
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
