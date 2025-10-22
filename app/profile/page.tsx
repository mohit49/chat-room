'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import AvatarUploader from '@/components/profile/AvatarUploader';
import UsernameInput from '@/components/profile/UsernameInput';
import MobileNumberUpdate from '@/components/profile/MobileNumberUpdate';
import LocationUpdate from '@/components/profile/LocationUpdate';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { EnhancedNotificationSettings } from '@/components/notifications/EnhancedNotificationSettings';
import { NudgeTestPanel } from '@/components/notifications/NudgeTestPanel';
import { SocketAndPushTestPanel } from '@/components/notifications/SocketAndPushTestPanel';
import { BackgroundNotificationTest } from '@/components/notifications/BackgroundNotificationTest';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import AppHeader from '@/components/layout/AppHeader';
import { api } from '@/lib/api';
import { getAuthToken, removeAuthToken } from '@/lib/auth';
import { isProfileComplete, getMissingProfileFields } from '@/lib/utils/profile';
import { UserProfile, Location } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FollowListDialog } from '@/components/user/FollowListDialog';
import { getFollowCounts } from '@/lib/api/follow';


// Calculate age from birth date
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Get max date (16 years ago from today)
const getMaxDate = (): string => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  return maxDate.toISOString().split('T')[0];
};

// Get min date (120 years ago - reasonable max age)
const getMinDate = (): string => {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  return minDate.toISOString().split('T')[0];
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState(''); // Track original username
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [profile, setProfile] = useState<UserProfile>({
    birthDate: '',
    age: 0,
    gender: '',
    location: {
      latitude: 0,
      longitude: 0,
      address: ''
    },
    profilePicture: undefined
  });

  // Check profile completion status
  const isComplete = isProfileComplete(profile, username);
  const missingFields = getMissingProfileFields(profile, username);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.getProfile(token);
        if (response.success && response.user) {
          setMobileNumber(response.user.mobileNumber);
          const currentUsername = response.user.username || '';
          setUsername(currentUsername);
          setOriginalUsername(currentUsername); // Store original username
          // Ensure we load the complete profile including profilePicture
          setProfile({
            birthDate: response.user.profile.birthDate || '',
            age: response.user.profile.age || 0,
            gender: response.user.profile.gender || '',
          location: response.user.profile.location || {
            latitude: 0,
            longitude: 0,
            address: '',
            area: '',
            city: '',
            state: '',
            isVisible: true
          },
            profilePicture: response.user.profile.profilePicture
          });

          // Fetch follow counts
          if (response.user.id) {
            try {
              const counts = await getFollowCounts(response.user.id);
              setFollowCounts(counts);
            } catch (err) {
              console.error('Error fetching follow counts:', err);
            }
          }
        } else {
          // If profile fetch fails, likely auth issue
          removeAuthToken();
          router.push('/login');
        }
      } catch (err) {
        // On error, redirect to login (likely auth expired)
        removeAuthToken();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Calculate age from birth date
    const calculatedAge = calculateAge(profile.birthDate);

    // Validate minimum age (16 years)
    if (profile.birthDate && calculatedAge < 16) {
      setError('You must be at least 16 years old to use this service.');
      setSaving(false);
      return;
    }

    // Update username first if it's different from original and not empty
    const hasUsernameChanged = username !== originalUsername;
    const isUsernameNotEmpty = username && username.trim() !== '';
    
    console.log('Username update check:', {
      username,
      originalUsername,
      hasUsernameChanged,
      isUsernameNotEmpty,
      willUpdate: hasUsernameChanged && isUsernameNotEmpty
    });

    if (hasUsernameChanged && isUsernameNotEmpty) {
      if (!isUsernameValid) {
        setError('Please fix username errors before saving');
        setSaving(false);
        return;
      }

      try {
        console.log('Calling updateUsername API with:', username);
        const usernameResponse = await api.updateUsername(token, username.trim());
        
        console.log('Username update response:', usernameResponse);
        
        if (usernameResponse.success && usernameResponse.user) {
          // Update local username state
          const newUsername = usernameResponse.user.username || username;
          setUsername(newUsername);
          setOriginalUsername(newUsername); // Update original username
          console.log('Username updated successfully to:', newUsername);
        } else {
          console.error('Username update failed:', usernameResponse.error);
          setError(usernameResponse.error || 'Failed to update username');
          setSaving(false);
          return;
        }
      } catch (err: any) {
        console.error('Username update exception:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response
        });
        setError(err.message || 'Failed to update username');
        setSaving(false);
        return;
      }
    } else {
      console.log('Skipping username update - no changes or empty username');
    }

    try {
      console.log('=== PROFILE UPDATE DEBUG ===');
      console.log('Profile Picture State:', profile.profilePicture);
      
      const updateData = {
        birthDate: profile.birthDate,
        age: calculatedAge,
        gender: profile.gender as 'male' | 'female' | 'other' | '',
        profilePicture: profile.profilePicture
      };
      
      console.log('Update Data being sent:', JSON.stringify(updateData, null, 2));
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Calling API endpoint: /user/profile');
      
      const response = await api.updateProfile(token, updateData as any);

      console.log('Profile update response:', response);
      
      if (response.success && response.user) {
        // Update local state with the response from server
        setProfile({
          birthDate: response.user.profile.birthDate || '',
          age: response.user.profile.age || 0,
          gender: response.user.profile.gender || '',
          location: response.user.profile.location || profile.location,
          profilePicture: response.user.profile.profilePicture
        });
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Profile updated successfully - user can manually navigate to home
        console.log('Profile updated successfully');
      } else {
        console.error('Profile update failed:', response.error);
        setError(response.error || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile update exception:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocation = async (locationData: Location) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await api.updateLocation(token, locationData);

    if (response.success && response.user) {
      // Update local state with new location
      setProfile(prev => ({
        ...prev,
        location: response.user?.profile?.location || prev.location
      }));
    } else {
      throw new Error(response.error || 'Failed to update location');
    }
  };

  const handleLogout = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
      // Force redirect to login
      router.push('/login');
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 lg:py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <AppHeader 
          {...APP_HEADER_CONFIGS.profile}
        />

        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a photo or choose an avatar</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AvatarUploader
              currentImage={profile.profilePicture?.type === 'upload' ? profile.profilePicture.url : undefined}
              avatarStyle={profile.profilePicture?.avatarStyle}
              avatarSeed={profile.profilePicture?.seed}
              username={mobileNumber}
              onImageChange={(imageData, type, style, seed) => {
                setProfile({
                  ...profile,
                  profilePicture: {
                    type,
                    url: type === 'upload' ? imageData : undefined,
                    avatarStyle: style,
                    seed: seed,
                  }
                });
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Mobile: {mobileNumber}</CardDescription>
            {user?.id && (
              <div className="mt-3">
                <FollowListDialog
                  userId={user.id}
                  followerCount={followCounts.followers}
                  followingCount={followCounts.following}
                />
              </div>
            )}
            {!isComplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium text-amber-800">
                    Complete your profile to access all features
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Missing: {missingFields.join(', ')}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <UsernameInput
                value={username}
                onChange={setUsername}
                onValidationChange={setIsUsernameValid}
              />

              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date (Must be 16+ years old)</Label>
                <DatePicker
                  date={profile.birthDate ? new Date(profile.birthDate + 'T00:00:00') : undefined}
                  onDateChange={(selectedDate) => {
                    if (selectedDate) {
                      // Format date using local timezone to avoid off-by-one errors
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      const newBirthDate = `${year}-${month}-${day}`;
                      
                      const calculatedAge = calculateAge(newBirthDate);
                      setProfile({ ...profile, birthDate: newBirthDate, age: calculatedAge });
                      
                      // Show warning if age is less than 16
                      if (calculatedAge < 16 && calculatedAge > 0) {
                        setError('You must be at least 16 years old to use this service.');
                      } else {
                        setError('');
                      }
                    } else {
                      setProfile({ ...profile, birthDate: '', age: 0 });
                      setError('');
                    }
                  }}
                  fromDate={new Date(getMinDate())}
                  toDate={new Date(getMaxDate())}
                  placeholder="Select your birth date"
                />
                {profile.birthDate && calculateAge(profile.birthDate) < 16 && calculateAge(profile.birthDate) > 0 && (
                  <p className="text-xs text-red-500">⚠️ Minimum age requirement: 16 years</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age (Auto-calculated)</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.birthDate ? calculateAge(profile.birthDate) : ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profile.gender}
                  onValueChange={(value: 'male' | 'female' | 'other' | '') => setProfile({ ...profile, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Location Update with Google Maps */}
        <LocationUpdate 
          location={profile.location}
          onLocationUpdate={handleUpdateLocation}
        />

        {/* Mobile Number Update */}
        <MobileNumberUpdate
          currentMobileNumber={mobileNumber}
          onSuccess={() => {
            // Refresh profile data
            window.location.reload();
          }}
        />

        {/* Notification Settings */}
        <EnhancedNotificationSettings />
      </div>
    </div>
  );
}

