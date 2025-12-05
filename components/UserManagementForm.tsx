'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Save, X, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  username: string;
  email?: string;
  isActive: boolean;
  isAdmin?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserManagementFormProps {
  user?: User | null;
  onSave: (userData: {
    username: string;
    password?: string;
    email?: string;
    isActive: boolean;
    isAdmin: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

export default function UserManagementForm({
  user,
  onSave,
  onDelete,
  onCancel,
  isNew = false,
}: UserManagementFormProps) {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin || false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username || !emailRegex.test(username)) {
      setError('Username must be a valid email address');
      return;
    }

    if (isNew && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        username,
        password: password || undefined,
        email: email || username,
        isActive,
        isAdmin,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isNew ? (
              <>
                <UserPlus className="w-5 h-5" />
                Create New User
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5" />
                Edit User
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isNew
              ? 'Create a new user account'
              : `Edit user: ${user?.username}`}
          </CardDescription>
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
              <label htmlFor="username" className="text-sm font-medium">
                Email (Username) <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
                required
                disabled={isLoading || !isNew}
              />
              {!isNew && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Username cannot be changed after creation
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {isNew ? (
                  <>
                    Password <span className="text-red-500">*</span>
                  </>
                ) : (
                  'New Password (leave blank to keep current)'
                )}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isNew ? 'Enter password (min 6 characters)' : 'Enter new password'}
                required={isNew}
                disabled={isLoading}
              />
            </div>

            {password && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm font-medium">Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm font-medium">Admin</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isNew ? 'Create User' : 'Save Changes'}
                  </>
                )}
              </Button>

              {!isNew && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

