/**
 * Rate limiting and usage tracking for ElevenLabs API
 */

export interface UsageStats {
  date: string; // ISO date string (YYYY-MM-DD)
  minutesUsed: number; // Total minutes of conversation
  messagesExchanged: number; // Total messages
  sessionsCompleted: number; // Number of sessions
}

export interface RateLimitConfig {
  dailyMinutesLimit?: number; // Daily limit in minutes
  dailyMessagesLimit?: number; // Daily limit in messages
  dailySessionsLimit?: number; // Daily limit in sessions
  monthlyMinutesLimit?: number; // Monthly limit in minutes
  warningThreshold?: number; // Percentage (0-100) at which to show warning
}

const USAGE_STATS_KEY = 'response-ready-usage-stats';
const DEFAULT_WARNING_THRESHOLD = 80; // Warn at 80% of limit

/**
 * Get all usage statistics
 */
export function getUsageStats(): UsageStats[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(USAGE_STATS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as UsageStats[];
  } catch (error) {
    console.error('Error loading usage stats:', error);
    return [];
  }
}

/**
 * Get today's usage statistics
 */
export function getTodayUsage(): UsageStats {
  const today = new Date().toISOString().split('T')[0];
  const allStats = getUsageStats();
  const todayStats = allStats.find((stat) => stat.date === today);

  return (
    todayStats || {
      date: today,
      minutesUsed: 0,
      messagesExchanged: 0,
      sessionsCompleted: 0,
    }
  );
}

/**
 * Get this month's usage statistics
 */
export function getMonthUsage(): UsageStats {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const allStats = getUsageStats();
  const monthStats = allStats.filter((stat) => {
    const statDate = new Date(stat.date);
    return (
      statDate.getFullYear() === year && statDate.getMonth() === month
    );
  });

  return monthStats.reduce(
    (total, stat) => ({
      date: `${year}-${String(month + 1).padStart(2, '0')}`,
      minutesUsed: total.minutesUsed + stat.minutesUsed,
      messagesExchanged: total.messagesExchanged + stat.messagesExchanged,
      sessionsCompleted: total.sessionsCompleted + stat.sessionsCompleted,
    }),
    {
      date: `${year}-${String(month + 1).padStart(2, '0')}`,
      minutesUsed: 0,
      messagesExchanged: 0,
      sessionsCompleted: 0,
    }
  );
}

/**
 * Record usage for a session
 */
export function recordUsage(
  minutes: number,
  messages: number,
  sessions: number = 1
): void {
  if (typeof window === 'undefined') return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const allStats = getUsageStats();
    const todayIndex = allStats.findIndex((stat) => stat.date === today);

    if (todayIndex >= 0) {
      allStats[todayIndex] = {
        ...allStats[todayIndex],
        minutesUsed: allStats[todayIndex].minutesUsed + minutes,
        messagesExchanged: allStats[todayIndex].messagesExchanged + messages,
        sessionsCompleted: allStats[todayIndex].sessionsCompleted + sessions,
      };
    } else {
      allStats.push({
        date: today,
        minutesUsed: minutes,
        messagesExchanged: messages,
        sessionsCompleted: sessions,
      });
    }

    // Keep only last 90 days of stats
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const filteredStats = allStats.filter((stat) => {
      const statDate = new Date(stat.date);
      return statDate >= cutoffDate;
    });

    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(filteredStats));
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}

/**
 * Check if usage is approaching limits
 */
export function checkRateLimits(
  config: RateLimitConfig = {}
): {
  isWarning: boolean;
  isLimitReached: boolean;
  warnings: string[];
  usage: {
    daily: UsageStats;
    monthly: UsageStats;
  };
} {
  const dailyUsage = getTodayUsage();
  const monthlyUsage = getMonthUsage();
  const warnings: string[] = [];
  let isWarning = false;
  let isLimitReached = false;

  const warningThreshold =
    config.warningThreshold || DEFAULT_WARNING_THRESHOLD;

  // Check daily limits
  if (config.dailyMinutesLimit) {
    const dailyMinutesPercent =
      (dailyUsage.minutesUsed / config.dailyMinutesLimit) * 100;
    if (dailyMinutesPercent >= 100) {
      isLimitReached = true;
      warnings.push(
        `Daily minutes limit reached (${dailyUsage.minutesUsed.toFixed(1)}/${config.dailyMinutesLimit} minutes)`
      );
    } else if (dailyMinutesPercent >= warningThreshold) {
      isWarning = true;
      warnings.push(
        `Approaching daily minutes limit: ${dailyUsage.minutesUsed.toFixed(1)}/${config.dailyMinutesLimit} minutes (${dailyMinutesPercent.toFixed(0)}%)`
      );
    }
  }

  if (config.dailyMessagesLimit) {
    const dailyMessagesPercent =
      (dailyUsage.messagesExchanged / config.dailyMessagesLimit) * 100;
    if (dailyMessagesPercent >= 100) {
      isLimitReached = true;
      warnings.push(
        `Daily messages limit reached (${dailyUsage.messagesExchanged}/${config.dailyMessagesLimit} messages)`
      );
    } else if (dailyMessagesPercent >= warningThreshold) {
      isWarning = true;
      warnings.push(
        `Approaching daily messages limit: ${dailyUsage.messagesExchanged}/${config.dailyMessagesLimit} messages (${dailyMessagesPercent.toFixed(0)}%)`
      );
    }
  }

  if (config.dailySessionsLimit) {
    const dailySessionsPercent =
      (dailyUsage.sessionsCompleted / config.dailySessionsLimit) * 100;
    if (dailySessionsPercent >= 100) {
      isLimitReached = true;
      warnings.push(
        `Daily sessions limit reached (${dailyUsage.sessionsCompleted}/${config.dailySessionsLimit} sessions)`
      );
    } else if (dailySessionsPercent >= warningThreshold) {
      isWarning = true;
      warnings.push(
        `Approaching daily sessions limit: ${dailyUsage.sessionsCompleted}/${config.dailySessionsLimit} sessions (${dailySessionsPercent.toFixed(0)}%)`
      );
    }
  }

  // Check monthly limits
  if (config.monthlyMinutesLimit) {
    const monthlyMinutesPercent =
      (monthlyUsage.minutesUsed / config.monthlyMinutesLimit) * 100;
    if (monthlyMinutesPercent >= 100) {
      isLimitReached = true;
      warnings.push(
        `Monthly minutes limit reached (${monthlyUsage.minutesUsed.toFixed(1)}/${config.monthlyMinutesLimit} minutes)`
      );
    } else if (monthlyMinutesPercent >= warningThreshold) {
      isWarning = true;
      warnings.push(
        `Approaching monthly minutes limit: ${monthlyUsage.minutesUsed.toFixed(1)}/${config.monthlyMinutesLimit} minutes (${monthlyMinutesPercent.toFixed(0)}%)`
      );
    }
  }

  return {
    isWarning,
    isLimitReached,
    warnings,
    usage: {
      daily: dailyUsage,
      monthly: monthlyUsage,
    },
  };
}

/**
 * Get default rate limit configuration
 * Based on typical ElevenLabs free tier limits
 */
export function getDefaultRateLimitConfig(): RateLimitConfig {
  return {
    dailyMinutesLimit: 10, // 10 minutes per day (adjust based on your plan)
    dailyMessagesLimit: 500, // 500 messages per day
    dailySessionsLimit: 20, // 20 sessions per day
    monthlyMinutesLimit: 300, // 300 minutes per month
    warningThreshold: DEFAULT_WARNING_THRESHOLD,
  };
}

/**
 * Clear usage statistics (for testing or reset)
 */
export function clearUsageStats(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USAGE_STATS_KEY);
}

