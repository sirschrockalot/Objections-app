'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  exportAllData,
  downloadJSON,
  exportCustomResponsesCSV,
  exportPracticeSessionsCSV,
  exportConfidenceRatingsCSV,
  downloadCSV,
  importData,
  parseJSONFile,
  validateExportData,
} from '@/lib/exportImport';
import { Download, Upload, FileJson, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExportImport() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    errors: string[];
    imported: any;
  } | null>(null);
  const [importOptions, setImportOptions] = useState({
    importObjections: false,
    importCustomResponses: true,
    importRatings: true,
    importSessions: true,
    importNotes: true,
    importTemplates: true,
    importComments: false,
    importPoints: false,
    importReviewSchedules: true,
    importPracticeHistory: true,
  });

  const handleExportAll = async () => {
    try {
      const data = await exportAllData();
      const filename = `objections-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(data, filename);
    } catch (error) {
      alert('Failed to export data: ' + error);
    }
  };

  const handleExportCSV = async (type: 'responses' | 'sessions' | 'ratings') => {
    try {
      let csv: string;
      let filename: string;

      switch (type) {
        case 'responses':
          csv = await exportCustomResponsesCSV();
          filename = `custom-responses-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'sessions':
          csv = await exportPracticeSessionsCSV();
          filename = `practice-sessions-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'ratings':
          csv = await exportConfidenceRatingsCSV();
          filename = `confidence-ratings-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          return;
      }

      downloadCSV(csv, filename);
    } catch (error) {
      alert('Failed to export CSV: ' + error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const data = await parseJSONFile(file);
      const validation = validateExportData(data);

      if (!validation.valid) {
        setImportResult({
          success: false,
          errors: validation.errors,
          imported: {},
        });
        setImporting(false);
        return;
      }

      const result = importData(data, importOptions);
      setImportResult(result);

      if (result.success) {
        // Reload page to refresh data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [`Failed to import: ${error}`],
        imported: {},
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Export your practice data for backup or sharing with your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Full Backup */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                Full Backup (JSON)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Export all your data including objections, responses, ratings, sessions, notes, templates, and more.
              </p>
              <Button onClick={handleExportAll} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
            </div>

            {/* CSV Exports */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export Reports (CSV)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV('responses')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Custom Responses
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV('sessions')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Practice Sessions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV('ratings')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Confidence Ratings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import data from a previous backup or from another user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Import Options */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Import Options</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importCustomResponses}
                    onChange={(e) =>
                      setImportOptions({ ...importOptions, importCustomResponses: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Custom Responses</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importRatings}
                    onChange={(e) => setImportOptions({ ...importOptions, importRatings: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Confidence Ratings</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importSessions}
                    onChange={(e) => setImportOptions({ ...importOptions, importSessions: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Practice Sessions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importNotes}
                    onChange={(e) => setImportOptions({ ...importOptions, importNotes: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Notes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importTemplates}
                    onChange={(e) => setImportOptions({ ...importOptions, importTemplates: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Response Templates</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importReviewSchedules}
                    onChange={(e) =>
                      setImportOptions({ ...importOptions, importReviewSchedules: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Review Schedules</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importPracticeHistory}
                    onChange={(e) =>
                      setImportOptions({ ...importOptions, importPracticeHistory: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Practice History</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importComments}
                    onChange={(e) => setImportOptions({ ...importOptions, importComments: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Comments</span>
                </label>
              </div>
            </div>

            {/* Import Button */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                  id="import-file-input"
                />
                <Button
                  asChild
                  disabled={importing}
                  className="w-full sm:w-auto"
                >
                  <label htmlFor="import-file-input" className="cursor-pointer flex items-center gap-2">
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import JSON File
                      </>
                    )}
                  </label>
                </Button>
              </label>
            </div>

            {/* Import Result */}
            <AnimatePresence>
              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-lg border ${
                    importResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {importResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        importResult.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {importResult.success ? 'Import Successful!' : 'Import Failed'}
                      </h4>
                      {importResult.success && importResult.imported && (
                        <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                          {importResult.imported.customResponses > 0 && (
                            <div>✓ {importResult.imported.customResponses} custom responses</div>
                          )}
                          {importResult.imported.ratings > 0 && (
                            <div>✓ {importResult.imported.ratings} confidence ratings</div>
                          )}
                          {importResult.imported.sessions > 0 && (
                            <div>✓ {importResult.imported.sessions} practice sessions</div>
                          )}
                          {importResult.imported.notes > 0 && <div>✓ {importResult.imported.notes} notes</div>}
                          {importResult.imported.templates > 0 && (
                            <div>✓ {importResult.imported.templates} templates</div>
                          )}
                          {importResult.imported.reviewSchedules > 0 && (
                            <div>✓ {importResult.imported.reviewSchedules} review schedules</div>
                          )}
                          {importResult.imported.practiceHistory > 0 && (
                            <div>✓ {importResult.imported.practiceHistory} practice history entries</div>
                          )}
                          <div className="mt-2 text-xs opacity-75">
                            Page will refresh in 2 seconds...
                          </div>
                        </div>
                      )}
                      {!importResult.success && importResult.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          <div className="font-medium mb-1">Errors:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {importResult.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warning */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Importing data will merge with your existing data. Duplicate items may be created.
                  We recommend exporting your current data first as a backup.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

