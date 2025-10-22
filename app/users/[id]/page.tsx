'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import { api } from '@/lib/api';
import UserActionButtons from '@/components/user/UserActionButtons';
import DirectMessageWidget from '@/components/chat/DirectMessageWidget';
import { FollowListDialog } from '@/components/user/FollowListDialog';
import { getFollowCounts } from '@/lib/api/follow';

interface UserProfile {
  id: string;
  username: string;
  mobileNumber: string;
  profile: {
    birthDate: string;
    age: number;
    gender: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
      area?: string;
      city?: string;
      state?: string;
      isVisible?: boolean;
    };
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  const userId = params.id as string;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.getUserById(userId);
        
        if (response.success && response.user) {
          setUser(response.user as unknown as UserProfile);
          
          // Fetch follow counts
          try {
            const counts = await getFollowCounts(userId);
            setFollowCounts(counts);
          } catch (err) {
            console.error('Error fetching follow counts:', err);
          }
        } else {
          setError(response.error || 'Failed to load user profile');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleBack = () => {
    router.back();
  };

  const getAvatarSrc = (profilePicture?: UserProfile['profile']['profilePicture']) => {
    if (!profilePicture) return '';
    
    if (profilePicture.type === 'upload' && profilePicture.url) {
      return profilePicture.url;
    }
    
    if (profilePicture.type === 'avatar' && profilePicture.avatarStyle && profilePicture.seed) {
      // Use a more stable URL format for DiceBear
      const style = profilePicture.avatarStyle.toLowerCase().replace(/\s+/g, '-');
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${profilePicture.seed}`;
    }
    
    return '';
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background py-4 lg:py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <AppHeader {...APP_HEADER_CONFIGS.profile} />
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading user profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background py-4 lg:py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <AppHeader {...APP_HEADER_CONFIGS.profile} />
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The user profile you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 lg:py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <AppHeader {...APP_HEADER_CONFIGS.profile} />

        {/* Back Button */}
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={getAvatarSrc(user.profile.profilePicture)}
                />
                <AvatarFallback className="text-2xl">
                  {user.profile.profilePicture?.type === 'avatar'
                    ? '🎭'
                    : user.username?.charAt(0).toUpperCase() || user.mobileNumber.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">@{user.username}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Member since {new Date(user.createdAt).getFullYear()}</Badge>
                </div>
                {/* Follow Counts */}
                <div className="mt-3">
                  <FollowListDialog
                    userId={user.id}
                    followerCount={followCounts.followers}
                    followingCount={followCounts.following}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Age</h3>
                <p className="text-lg">{user.profile.age || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Gender</h3>
                <p className="text-lg">{user.profile.gender || 'Not specified'}</p>
              </div>
              {user.profile.location.isVisible !== false && (user.profile.location.city || user.profile.location.state) && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Location</h3>
                  <p className="text-lg">
                    {user.profile.location.city && user.profile.location.state
                      ? `${user.profile.location.city}, ${user.profile.location.state}`
                      : user.profile.location.city || user.profile.location.state}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t">
              <UserActionButtons
                targetUserId={user.id}
                targetUsername={user.username}
                onMessageClick={() => setIsDirectMessageOpen(true)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Message Widget */}
      {user && (
        <DirectMessageWidget
          isOpen={isDirectMessageOpen}
          onClose={() => setIsDirectMessageOpen(false)}
          targetUser={{
            id: user.id,
            username: user.username,
            profilePicture: user.profile.profilePicture
          }}
        />
      )}
    </div>
  );
}
