'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { isProfileComplete, getMissingProfileFields } from '@/lib/utils/profile';

export const useProfileCompletion = () => {
  const { user } = useAuth();

  if (!user) {
    return {
      isComplete: false,
      missingFields: ['Login required'],
      isLoading: false
    };
  }

  const profile = user.profile;
  const username = user.username;

  const isComplete = isProfileComplete(profile, username);
  const missingFields = getMissingProfileFields(profile, username);

  return {
    isComplete,
    missingFields,
    isLoading: false,
    user
  };
};

