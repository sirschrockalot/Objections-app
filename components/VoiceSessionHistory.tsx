'use client';

import { useState, useEffect } from 'react';
import { VoiceSession } from '@/types';
import { getVoiceSessions, getVoiceSessionStats, deleteVoiceSession } from '@/lib/voiceSessionStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  MessageSquare, 
  Calendar, 
  Trash2, 
  Eye, 
  X,
  TrendingUp,
  Mic,
  CheckCircle,
  Download,
  Share2,
  FileText,
  FileJson,
  FileSpreadsheet,
  Sparkles,
  BarChart3
} from 'lucide-react';
import ConversationTranscript from './ConversationTranscript';
import PostSessionFeedback from './PostSessionFeedback';
import VoiceSessionComparison from './VoiceSessionComparison';
import {
  exportVoiceSessionJSON,
  exportVoiceSessionTXT,
  exportVoiceSessionCSV,
  exportAllVoiceSessionsJSON,
  exportAllVoiceSessionsCSV,
  copySessionSummaryToClipboard,
} from '@/lib/voiceSessionExport';

export default function VoiceSessionHistory() {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [stats, setStats] = useState(getVoiceSessionStats());
  const [selectedSession, setSelectedSession] = useState<VoiceSession | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'messages'>('date');
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedSessionsForComparison, setSelectedSessionsForComparison] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadSessions();
    // Refresh every 5 seconds
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = () => {
    const allSessions = getVoiceSessions();
    const sorted = [...allSessions].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'duration':
          return (b.metrics.totalDuration || 0) - (a.metrics.totalDuration || 0);
        case 'messages':
          return b.metrics.messagesExchanged - a.metrics.messagesExchanged;
        default:
          return 0;
      }
    });
    setSessions(sorted);
    setStats(getVoiceSessionStats());
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteVoiceSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      loadSessions();
    }
  };

  const handleExport = (session: VoiceSession, format: 'json' | 'txt' | 'csv') => {
    switch (format) {
      case 'json':
        exportVoiceSessionJSON(session);
        break;
      case 'txt':
        exportVoiceSessionTXT(session);
        break;
      case 'csv':
        exportVoiceSessionCSV(session);
        break;
    }
    setShowExportMenu(null);
  };

  const handleShare = async (session: VoiceSession) => {
    const success = await copySessionSummaryToClipboard(session);
    if (success) {
      setCopySuccess(session.id);
      setTimeout(() => setCopySuccess(null), 2000);
    }
    setShowExportMenu(null);
  };

  const handleExportAll = (format: 'json' | 'csv') => {
    switch (format) {
      case 'json':
        exportAllVoiceSessionsJSON();
        break;
      case 'csv':
        exportAllVoiceSessionsCSV();
        break;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <Mic className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                <p className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(stats.averageSessionDuration)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Practice Sessions</CardTitle>
              <CardDescription>
                Review your past voice practice conversations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedSessionsForComparison.size >= 2 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Compare ({selectedSessionsForComparison.size})
                </Button>
              )}
              {sessions.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportMenu(showExportMenu === 'all' ? null : 'all')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All
                  </Button>
                  {showExportMenu === 'all' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleExportAll('json')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                      >
                        <FileJson className="w-4 h-4" />
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExportAll('csv')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export as CSV
                      </button>
                    </div>
                  )}
                </div>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="duration">Sort by Duration</option>
                <option value="messages">Sort by Messages</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No voice practice sessions yet.</p>
              <p className="text-sm mt-2">Start a voice practice session to see it here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {formatDate(session.startTime)}
                        </span>
                        {session.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(session.metrics.totalDuration)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {session.metrics.messagesExchanged} messages
                        </div>
                        {session.metrics.objectionsHandled > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {session.metrics.objectionsHandled} objections
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSet = new Set(selectedSessionsForComparison);
                          if (newSet.has(session.id)) {
                            newSet.delete(session.id);
                          } else {
                            newSet.add(session.id);
                          }
                          setSelectedSessionsForComparison(newSet);
                        }}
                        className={selectedSessionsForComparison.has(session.id) ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                      >
                        {selectedSessionsForComparison.has(session.id) ? '✓ Selected' : 'Select'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExportMenu(showExportMenu === session.id ? null : session.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {showExportMenu === session.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => handleExport(session, 'txt')}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              Export as TXT
                            </button>
                            <button
                              onClick={() => handleExport(session, 'json')}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <FileJson className="w-4 h-4" />
                              Export as JSON
                            </button>
                            <button
                              onClick={() => handleExport(session, 'csv')}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              Export as CSV
                            </button>
                            <div className="border-t my-1" />
                            <button
                              onClick={() => handleShare(session)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <Share2 className="w-4 h-4" />
                              {copySuccess === session.id ? 'Copied!' : 'Copy Summary'}
                            </button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(session.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Voice Practice Session</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(selectedSession.startTime)}
                    {selectedSession.endTime && (
                      <> • Duration: {formatDuration(selectedSession.metrics.totalDuration)}</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportMenu(showExportMenu === 'modal' ? null : 'modal')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                    {showExportMenu === 'modal' && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-20">
                        <button
                          onClick={() => handleExport(selectedSession, 'txt')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Export as TXT
                        </button>
                        <button
                          onClick={() => handleExport(selectedSession, 'json')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <FileJson className="w-4 h-4" />
                          Export as JSON
                        </button>
                        <button
                          onClick={() => handleExport(selectedSession, 'csv')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Export as CSV
                        </button>
                        <div className="border-t my-1" />
                        <button
                          onClick={() => handleShare(selectedSession)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <Share2 className="w-4 h-4" />
                          {copySuccess === selectedSession.id ? 'Copied!' : 'Copy Summary'}
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSession(null);
                      setShowExportMenu(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {/* Tabs */}
                <div className="flex gap-2 mb-4 border-b">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      !showFeedback
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    Transcript
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                      showFeedback
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Feedback
                  </button>
                </div>

                {!showFeedback ? (
                  <>
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="text-lg font-bold">
                          {formatDuration(selectedSession.metrics.totalDuration)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                        <p className="text-lg font-bold">
                          {selectedSession.metrics.messagesExchanged}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="text-lg font-bold capitalize">{selectedSession.status}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Conversation Transcript</h3>
                      <ConversationTranscript messages={selectedSession.messages} />
                    </div>
                  </>
                ) : (
                  <PostSessionFeedback
                    session={selectedSession}
                    onClose={() => setShowFeedback(false)}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && selectedSessionsForComparison.size >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowComparison(false);
              setSelectedSessionsForComparison(new Set());
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Session Comparison</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowComparison(false);
                    setSelectedSessionsForComparison(new Set());
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <VoiceSessionComparison
                  sessions={sessions.filter((s) => selectedSessionsForComparison.has(s.id))}
                  onClose={() => {
                    setShowComparison(false);
                    setSelectedSessionsForComparison(new Set());
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

