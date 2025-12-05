'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, clearCurrentUser, trackUserActivity } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserProfile from './UserProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserMenu() {
  const [user, setUser] = useState(getCurrentUser());
  const [showProfile, setShowProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check admin status
    const checkAdminStatus = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          const { fetchCurrentUser } = await import('@/lib/auth');
          const fullUser = await fetchCurrentUser();
          setIsAdmin(fullUser?.isAdmin === true);
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    // Listen for auth changes
    const handleStorageChange = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        void checkAdminStatus();
      } else {
        setIsAdmin(false);
      }
    };

    // Initial check
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      void checkAdminStatus();
    }

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    clearCurrentUser();
    setUser(null);
    router.push('/auth');
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/auth')}
        className="flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        Login
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user.username}</span>
              {user.email && (
                <span className="text-xs text-gray-500 font-normal">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfile(true)}>
            <User className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">
                Admin
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <Shield className="w-4 h-4 mr-2" />
                Manage Users
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowProfile(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Profile</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <UserProfile onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

