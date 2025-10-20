'use client';

import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ProfileCompletionBannerProps {
  isComplete: boolean;
  missingFields: string[];
}

export default function ProfileCompletionBanner({ isComplete, missingFields }: ProfileCompletionBannerProps) {
  const router = useRouter();

  if (isComplete) return null;

  return (
    <div className="relative w-full bg-amber-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">
                You haven't completed your profile yet!
              </p>
              <p className="text-xs sm:text-sm opacity-90">
                Missing: {missingFields.join(', ')}. Complete your profile to start chatting.
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/profile')}
            variant="secondary"
            size="sm"
            className="bg-white text-amber-600 hover:bg-gray-100 flex-shrink-0"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

