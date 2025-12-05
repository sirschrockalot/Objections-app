'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DataMigration from '@/components/DataMigration';

export default function MigratePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Data Migration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Migrate your existing practice data from localStorage to MongoDB Atlas for secure, cloud-based storage.
          </p>
          <DataMigration />
        </div>
      </div>
    </AuthGuard>
  );
}

