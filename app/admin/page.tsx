'use client';

import { useState, useEffect } from 'react';
import { error as logError } from '@/lib/logger';
import { getAllUsers, getUserActivities, getUserStats, getCurrentUser, isAuthenticated, clearCurrentUser, createUser, updateUser, deleteUser } from '@/lib/auth';
import { getAuthHeaders } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Activity, Calendar, TrendingUp, LogOut, Loader2, UserPlus, Shield, BarChart3, Clock, Users, Zap, Home as HomeIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import UserManagementForm from '@/components/UserManagementForm';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'analytics'>('users');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  useEffect(() => {
    const checkAuth = async () => {
      if (!(await isAuthenticated())) {
        router.push('/auth');
        return;
      }
      setIsChecking(false);
      const user = await getCurrentUser();
      setCurrentUser(user);
      // Refresh users list
      getAllUsers().then(setUsers);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (viewMode === 'analytics' && currentUser) {
      loadAnalytics();
    }
  }, [viewMode, analyticsDays, currentUser]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setError('');
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/auth/analytics?days=${analyticsDays}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load analytics' }));
        throw new Error(errorData.error || 'Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      logError('Failed to load analytics', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      setIsLoading(true);
      Promise.all([
        getUserActivities(selectedUserId),
        getUserStats(selectedUserId),
      ]).then(([activitiesData, statsData]) => {
        setActivities(activitiesData);
        setStats(statsData);
        setIsLoading(false);
      });
    }
  }, [selectedUserId]);

  const handleLogout = async () => {
    await clearCurrentUser();
    router.push('/auth');
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
    setError('');
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserForm(true);
    setError('');
  };

  const handleSaveUser = async (userData: {
    username: string;
    password?: string;
    email?: string;
    isActive: boolean;
    isAdmin: boolean;
  }) => {
    try {
      setError('');
      if (editingUser) {
        await updateUser(editingUser.id, userData);
      } else {
        await createUser(userData.username, userData.password || '', userData.email, userData.isAdmin);
      }
      setShowUserForm(false);
      setEditingUser(null);
      // Refresh users list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
      throw err;
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    try {
      setError('');
      await deleteUser(editingUser.id);
      setShowUserForm(false);
      setEditingUser(null);
      // Refresh users list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      setSelectedUserId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      throw err;
    }
  };

  const handleCancelForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage users and track activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Logged in as: <strong>{currentUser.username}</strong>
                  {currentUser.isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                      Admin
                    </span>
                  )}
                </span>
              )}
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                title="Back to main app"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Back to App
              </Button>
              {!showUserForm && viewMode === 'users' && (
                <Button onClick={handleCreateUser}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'users' ? 'default' : 'outline'}
              onClick={() => setViewMode('users')}
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'outline'}
              onClick={() => setViewMode('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Team Analytics
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {showUserForm ? (
          <div className="mb-6">
            <UserManagementForm
              user={editingUser}
              onSave={handleSaveUser}
              onDelete={editingUser ? handleDeleteUser : undefined}
              onCancel={handleCancelForm}
              isNew={!editingUser}
            />
          </div>
        ) : null}

        {viewMode === 'analytics' ? (
          <div className="space-y-6">
            {/* Analytics View */}
            {analyticsLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-red-600 dark:text-red-400 mb-4">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-semibold">Error loading analytics</p>
                    <p className="text-sm mt-2">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : analytics ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.summary.totalUsers}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {analytics.summary.activeUsers} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Total Usage Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.summary.totalSessionTimeHours}h</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {analytics.summary.totalSessionTimeMinutes} minutes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.summary.totalSessions}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Avg: {analytics.summary.averageSessionTimeMinutes}m
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Logins
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.summary.totalLogins}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Last {analyticsDays} days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Time Period Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Time Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {[7, 30, 60, 90].map((days) => (
                        <Button
                          key={days}
                          variant={analyticsDays === days ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAnalyticsDays(days)}
                        >
                          {days} days
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Most Active Users
                    </CardTitle>
                    <CardDescription>
                      Top users by engagement score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topUsers.map((user: any, index: number) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {user.username}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>{user.metrics.totalLogins} logins</span>
                                <span>{user.metrics.totalSessions} sessions</span>
                                <span>{user.metrics.totalSessionTimeMinutes}m total</span>
                                <span>{user.metrics.activeDays} active days</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {user.metrics.engagementScore}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              score
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.trends.activityByType)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([action, count]) => (
                            <div
                              key={action}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {action.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {count as number}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Peak Usage Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.trends.hourlyActivity)
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([hour, count]) => {
                            const hourNum = parseInt(hour);
                            const maxCount = Math.max(...Object.values(analytics.trends.hourlyActivity) as number[]);
                            const percentage = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0;
                            return (
                              <div key={hour} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {hourNum.toString().padStart(2, '0')}:00
                                  </span>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {count as number}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All Users Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Users Activity</CardTitle>
                    <CardDescription>
                      Complete breakdown of user activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-2 font-medium">User</th>
                            <th className="text-right p-2 font-medium">Logins</th>
                            <th className="text-right p-2 font-medium">Sessions</th>
                            <th className="text-right p-2 font-medium">Time (min)</th>
                            <th className="text-right p-2 font-medium">Active Days</th>
                            <th className="text-right p-2 font-medium">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.allUsers.map((user: any) => (
                            <tr
                              key={user.userId}
                              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td className="p-2">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {user.username}
                                  </p>
                                  {user.email && user.email !== user.username && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {user.email}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="text-right p-2">{user.metrics.totalLogins}</td>
                              <td className="text-right p-2">{user.metrics.totalSessions}</td>
                              <td className="text-right p-2">{user.metrics.totalSessionTimeMinutes}</td>
                              <td className="text-right p-2">{user.metrics.activeDays}</td>
                              <td className="text-right p-2 font-semibold text-blue-600 dark:text-blue-400">
                                {user.metrics.engagementScore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No analytics data available
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Users ({users.length})
                </CardTitle>
                <CardDescription>
                  Select a user to view their activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No users registered yet
                    </p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          selectedUserId === user.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className="flex-1 flex items-center gap-3 text-left min-w-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {user.username}
                                </p>
                                {user.isAdmin && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                                    Admin
                                  </span>
                                )}
                                {!user.isActive && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              {user.email && user.email !== user.username && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {user.email}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Joined: {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="ml-2 flex-shrink-0"
                          >
                            <User className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
                </CardContent>
              </Card>
            ) : selectedUser ? (
              <>
                {/* User Stats */}
                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Statistics for {selectedUser.username}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Logins</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stats.totalLogins}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stats.totalSessions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {stats.lastLoginAt
                              ? formatDate(stats.lastLoginAt)
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                      {Object.keys(stats.actionsByType).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium mb-2">Activity Breakdown</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(stats.actionsByType).map(([action, count]) => (
                              <div
                                key={action}
                                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                              >
                                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                  {action.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {count as number}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Activity Log */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Activity Log ({activities.length})
                    </CardTitle>
                    <CardDescription>
                      Recent activity for {selectedUser.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {activities.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No activity recorded
                        </p>
                      ) : (
                        activities
                          .slice()
                          .reverse()
                          .map((activity, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                    {activity.action.replace(/([A-Z])/g, ' $1').trim()}
                                  </p>
                                  {Object.keys(activity.metadata).length > 0 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {JSON.stringify(activity.metadata, null, 2)}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a user from the list to view their activity
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}

