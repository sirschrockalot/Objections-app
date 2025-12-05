'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, clearCurrentUser, getUserStats, trackUserActivity, changePassword, updateUserEmail, setCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut, Activity, Calendar, TrendingUp, Lock, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfileProps {
  onLogout: () => void;
}

export default function UserProfile({ onLogout }: UserProfileProps) {
  const [user, setUser] = useState(getCurrentUser());
  const [stats, setStats] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getUserStats(user.id).then(setStats);
      setNewEmail(user.email || '');
    }
  }, [user]);

  const handleLogout = () => {
    clearCurrentUser();
    onLogout();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    setIsLoading(true);

    try {
      if (!currentPassword || !newPassword) {
        setPasswordError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        setIsLoading(false);
        return;
      }

      if (!user) {
        setPasswordError('User not found');
        setIsLoading(false);
        return;
      }

      await changePassword(user.id, currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setIsLoading(true);

    try {
      if (!user) {
        setEmailError('User not found');
        setIsLoading(false);
        return;
      }

      const updatedUser = await updateUserEmail(user.id, newEmail);
      setCurrentUser(updatedUser);
      setUser(updatedUser);
      setEmailSuccess(true);
      
      setTimeout(() => {
        setShowEmailChange(false);
        setEmailSuccess(false);
      }, 2000);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{user.username}</CardTitle>
                {user.email && (
                  <CardDescription>{user.email}</CardDescription>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Member since</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            {user.lastLoginAt && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last login</p>
                <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setPasswordError('');
                setPasswordSuccess(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Change Password
              </span>
            </Button>

            {showPasswordChange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  {passwordError && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Password changed successfully!</span>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (min 6 characters)"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordError('');
                        setPasswordSuccess(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Email Change Section */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEmailChange(!showEmailChange);
                setEmailError('');
                setEmailSuccess(false);
                if (user) {
                  setNewEmail(user.email || '');
                }
              }}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Update Email
              </span>
            </Button>

            {showEmailChange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <form onSubmit={handleEmailChange} className="space-y-3">
                  {emailError && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{emailError}</span>
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Email updated successfully!</span>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Email'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowEmailChange(false);
                        setEmailError('');
                        setEmailSuccess(false);
                        if (user) {
                          setNewEmail(user.email || '');
                        }
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {stats && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  View Activity Stats
                </span>
                <TrendingUp className="w-4 h-4" />
              </Button>

              {showStats && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Logins</p>
                      <p className="font-semibold text-lg">{stats.totalLogins}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Sessions</p>
                      <p className="font-semibold text-lg">{stats.totalSessions}</p>
                    </div>
                  </div>
                  {Object.keys(stats.actionsByType).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Activity Breakdown</p>
                      <div className="space-y-1">
                        {Object.entries(stats.actionsByType).map(([action, count]) => (
                          <div key={action} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {action.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

