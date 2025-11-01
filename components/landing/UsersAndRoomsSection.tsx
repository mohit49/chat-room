'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  MessageCircle, 
  Users, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { InteractiveUserCards, InteractiveRoomCards } from './InteractiveCards';

interface UsersAndRoomsSectionProps {
  initialUsers?: any[];
  initialRooms?: any[];
}

export function UsersAndRoomsSection({ initialUsers = [], initialRooms = [] }: UsersAndRoomsSectionProps) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [rooms, setRooms] = useState<any[]>(initialRooms);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Only fetch users client-side if we don't have initial data (for real-time updates)
  useEffect(() => {
    // Skip if we already have initial data from server
    if (initialUsers.length > 0) {
      // Still fetch for updates, but don't show loading
      const fetchUsers = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiUrl}/user/public?limit=10`);
          const data = await response.json();
          if (data.success && data.users) {
            setUsers(data.users);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
      return;
    }

    // Only show loading if we don't have initial data
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/user/public?limit=10`);
        const data = await response.json();
        if (data.success && data.users) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [initialUsers.length]);

  // Only fetch rooms client-side if we don't have initial data (for real-time updates)
  useEffect(() => {
    // Skip if we already have initial data from server
    if (initialRooms.length > 0) {
      // Still fetch for updates, but don't show loading
      const fetchRooms = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiUrl}/rooms/public?limit=10`);
          const data = await response.json();
          if (data.success && data.rooms) {
            setRooms(data.rooms);
          }
        } catch (error) {
          console.error('Error fetching rooms:', error);
        }
      };
      fetchRooms();
      return;
    }

    // Only show loading if we don't have initial data
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/rooms/public?limit=10`);
        const data = await response.json();
        if (data.success && data.rooms) {
          setRooms(data.rooms);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [initialRooms.length]);

  return (
    <>
      {/* Active Users Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full mb-4 border border-green-500/50">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Our Community</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Meet Amazing People
            </h2>
            <p className="text-xl text-gray-300">
              Connect with users from around the world on Flipy Chat
            </p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
                <InteractiveUserCards users={users} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No active users at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Rooms Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full mb-4 border border-orange-500/50">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Trending</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Popular Chat Rooms
            </h2>
            <p className="text-xl text-gray-300">
              Join vibrant communities and discover new interests
            </p>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : rooms.length > 0 ? (
            <>
              <div className="relative">
                <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
                  <InteractiveRoomCards rooms={rooms} />
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                    Explore All Rooms
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No chat rooms available</p>
              <Link href="/login">
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Create the First Room
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

