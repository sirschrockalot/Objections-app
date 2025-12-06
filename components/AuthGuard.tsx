'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated, getCurrentUser, fetchCurrentUser } from '@/lib/auth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForcePasswordChangeModal from './ForcePasswordChangeModal';
import SessionTimeoutWarning from './SessionTimeoutWarning';
import { initializeActivityTracking, stopActivityTracking, resetSession } from '@/lib/sessionTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let activityCleanup: (() => void) | null = null;

    // Check authentication status and password change requirement
    const checkAuth = async () => {
      const auth = isAuthenticated();
      setAuthenticated(auth);
      
      if (auth) {
        // Initialize session timeout tracking
        resetSession();
        activityCleanup = initializeActivityTracking();
        
        // Check if user must change password
        try {
          const fullUser = await fetchCurrentUser();
          if (fullUser?.mustChangePassword) {
            setMustChangePassword(true);
          } else {
            setMustChangePassword(false);
          }
        } catch (error) {
          console.error('Error checking password change requirement:', error);
          setMustChangePassword(false);
        }
      } else {
        // Stop tracking if not authenticated
        stopActivityTracking();
      }
      
      setIsChecking(false);
    };

    void checkAuth();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'response-ready-current-user-id') {
        void checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (activityCleanup) {
        activityCleanup();
      }
      stopActivityTracking();
    };
  }, []);

  const handleAuthSuccess = async () => {
    setAuthenticated(true);
    // Reset session timeout on successful login
    resetSession();
    initializeActivityTracking();
    
    // Check if password change is required after login
    try {
      const fullUser = await fetchCurrentUser();
      if (fullUser?.mustChangePassword) {
        setMustChangePassword(true);
      }
    } catch (error) {
      console.error('Error checking password change requirement:', error);
    }
  };

  const handlePasswordChanged = async () => {
    // Refresh user data
    try {
      const updatedUser = await fetchCurrentUser();
      if (updatedUser && !updatedUser.mustChangePassword) {
        setMustChangePassword(false);
      }
    } catch (error) {
      console.error('Error refreshing user after password change:', error);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
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

  // Show forced password change modal if required
  if (mustChangePassword) {
    return <ForcePasswordChangeModal onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <>
      <SessionTimeoutWarning
        onExtend={() => {
          resetSession();
        }}
        onLogout={async () => {
          setAuthenticated(false);
        }}
      />
      {children}
    </>
  );
}

