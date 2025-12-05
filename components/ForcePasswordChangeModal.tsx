'use client';

import { useState } from 'react';
import { changePassword, fetchCurrentUser, setCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ForcePasswordChangeModalProps {
  onPasswordChanged: () => void;
}

export default function ForcePasswordChangeModal({ onPasswordChanged }: ForcePasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Get current user to get their ID
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        setError('User not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      // For first-time password change, we need to use the temp password as current password
      // But we don't have it here. We need a special endpoint for this.
      // Actually, let me check the change-password route - it requires current password.
      // We need a different approach - maybe a special endpoint for first-time password change
      // Or we can use the temp password that was just used to login.
      
      // For now, let's create a special endpoint or modify the change-password to handle this case
      // Actually, better approach: store the temp password in session during login if mustChangePassword is true
      // Or create a special endpoint that doesn't require current password when mustChangePassword is true
      
      // Let me create a special API endpoint for forced password change
      const response = await fetch('/api/auth/force-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Refresh user data to clear mustChangePassword flag
      const updatedUser = await fetchCurrentUser();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }

      onPasswordChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-yellow-500 dark:border-yellow-600">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Change Your Password</CardTitle>
                <CardDescription>
                  You must change your temporary password before continuing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password (min 6 characters)"
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                You cannot proceed until you change your password
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

