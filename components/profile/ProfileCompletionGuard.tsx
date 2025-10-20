'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface ProfileCompletionGuardProps {
  isComplete: boolean;
  missingFields: string[];
  children: ReactNode;
  featureName?: string;
}

export default function ProfileCompletionGuard({ 
  isComplete, 
  missingFields, 
  children,
  featureName = 'this feature'
}: ProfileCompletionGuardProps) {
  const router = useRouter();

  if (isComplete) {
    return <>{children}</>;
  }

  // Show blocked message if profile is incomplete
  return (
    <Card className="border-amber-500 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <div>
            <CardTitle className="text-amber-900">Complete Your Profile Required</CardTitle>
            <CardDescription className="text-amber-700">
              You need to complete your profile to access {featureName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white rounded-lg border border-amber-200">
          <p className="text-sm font-medium text-amber-900 mb-2">Missing Information:</p>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
        <Button 
          onClick={() => router.push('/profile')}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          Complete Profile Now
        </Button>
      </CardContent>
    </Card>
  );
}

