'use client';

import { useState } from 'react';
import { migrateLocalStorageToMongo } from '@/lib/migrateStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    migrated: Record<string, number>;
    error?: string;
  } | null>(null);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateLocalStorageToMongo();
      setResult(migrationResult);
    } catch (error: any) {
      setResult({
        success: false,
        migrated: {},
        error: error.message || 'Migration failed',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const totalMigrated = result?.migrated
    ? Object.values(result.migrated).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Migrate Data to MongoDB
        </CardTitle>
        <CardDescription>
          Move your existing localStorage data to MongoDB Atlas for secure, cloud-based storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will migrate all your practice data, custom responses, notes, and progress from
              localStorage to MongoDB. Your data will be preserved and accessible across devices.
            </p>
            <Button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="w-full"
              size="lg"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Start Migration
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {result.success ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Migration Successful!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Successfully migrated {totalMigrated} items to MongoDB.
                    </p>
                    {Object.keys(result.migrated).length > 0 && (
                      <div className="space-y-1 text-sm">
                        {Object.entries(result.migrated).map(([key, count]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-green-600 dark:text-green-400 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="font-medium text-green-900 dark:text-green-100">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                      Migration Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {result.error || 'An unknown error occurred during migration.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setResult(null);
              }}
              variant="outline"
              className="w-full"
            >
              {result.success ? 'Migrate Again' : 'Try Again'}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

