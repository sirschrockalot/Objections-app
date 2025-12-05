'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleAuthSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AnimatePresence mode="wait">
        {authMode === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setAuthMode('register')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setAuthMode('login')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

