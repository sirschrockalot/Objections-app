'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { UserPlus, LogIn, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { registerUser, setCurrentUser } from '@/lib/auth';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      // Username is now the email address
      const user = await registerUser(
        email.trim(),
        password,
        email.trim()
      );

      setCurrentUser(user);
      setSuccess(true);

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Create Account
          </CardTitle>
          <CardDescription>
            Sign up to track your progress and save your practice sessions
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

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Account created successfully! Redirecting...</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="reg-email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
                autoComplete="email"
                disabled={isLoading || success}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your email address will be used as your username
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="reg-password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password (min 6 characters)"
                autoComplete="new-password"
                disabled={isLoading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reg-confirm-password" className="text-sm font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={isLoading || success}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Account created!
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <LogIn className="w-4 h-4" />
              Already have an account? Login
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

