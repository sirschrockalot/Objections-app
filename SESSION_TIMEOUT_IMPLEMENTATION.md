# Session Timeout Implementation

## Overview

Implemented comprehensive session timeout and idle detection features to enhance application security. This ensures users are automatically logged out after periods of inactivity or when their session exceeds a maximum duration.

## Features Implemented

### 1. Idle Timeout
- **Default**: 30 minutes of inactivity
- **Configurable**: Via `NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES` environment variable
- **Activity Tracking**: Monitors mouse, keyboard, scroll, touch, and click events
- **Automatic Logout**: Logs out user if no activity detected for the timeout period

### 2. Maximum Session Duration
- **Default**: 8 hours
- **Configurable**: Via `NEXT_PUBLIC_MAX_SESSION_HOURS` environment variable
- **Force Logout**: Requires re-authentication after maximum session time

### 3. Warning System
- **Default**: Shows warning 5 minutes before timeout
- **Configurable**: Via `NEXT_PUBLIC_WARNING_BEFORE_TIMEOUT_MINUTES` environment variable
- **User Choice**: Users can extend session or log out
- **Visual Warning**: Modal dialog with countdown timer

### 4. Activity Detection
- Tracks multiple user interaction types:
  - Mouse movements and clicks
  - Keyboard input
  - Scroll events
  - Touch events
- Resets idle timer on any activity
- Passive event listeners for performance

## Files Created

1. **`lib/sessionTimeout.ts`**:
   - Core session timeout utilities
   - Activity tracking functions
   - Timeout checking logic
   - Configuration management

2. **`components/SessionTimeoutWarning.tsx`**:
   - Warning modal component
   - Countdown timer display
   - Extend/Logout options
   - Automatic logout on timeout

## Files Modified

1. **`components/AuthGuard.tsx`**:
   - Integrated session timeout tracking
   - Initializes activity tracking on login
   - Cleans up on logout
   - Shows timeout warning component

2. **`.env.example`**:
   - Added session timeout configuration variables

## Configuration

Add to `.env.local`:

```env
# Session Timeout Configuration (Optional)
# Idle timeout: Logout after X minutes of inactivity (default: 30)
NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES=30

# Max session duration: Force logout after X hours (default: 8)
NEXT_PUBLIC_MAX_SESSION_HOURS=8

# Warning before timeout: Show warning X minutes before logout (default: 5)
NEXT_PUBLIC_WARNING_BEFORE_TIMEOUT_MINUTES=5
```

## How It Works

1. **On Login**:
   - Session tracking starts
   - Activity listeners are attached
   - Session start time is recorded

2. **During Session**:
   - All user interactions reset the idle timer
   - System checks every 10 seconds for timeout conditions
   - Warning shown when approaching timeout

3. **Before Timeout**:
   - Warning modal appears 5 minutes (configurable) before timeout
   - User can choose to:
     - **Stay Logged In**: Resets both idle and session timers
     - **Log Out**: Immediately logs out

4. **On Timeout**:
   - User is automatically logged out
   - All tokens are cleared
   - User redirected to login page

## Security Benefits

1. **Prevents Unauthorized Access**: 
   - Automatic logout if user leaves device unattended
   - Limits exposure window if device is compromised

2. **Compliance**: 
   - Meets security requirements for session management
   - Enforces maximum session duration

3. **User Awareness**: 
   - Warning system gives users control
   - Clear indication of session status

4. **Multi-Layer Protection**:
   - Works alongside JWT token expiration (15 min access tokens)
   - Complements refresh token system (7 day refresh tokens)
   - Adds client-side session management

## User Experience

- **Seamless**: Activity tracking is passive and doesn't impact performance
- **Transparent**: Users are warned before timeout
- **Flexible**: Users can extend session if needed
- **Non-Intrusive**: Only shows warning when necessary

## Testing

To test the session timeout:

1. **Idle Timeout Test**:
   - Log in to the application
   - Wait 25 minutes (if warning is set to 5 min before 30 min timeout)
   - Warning should appear
   - Wait additional 5 minutes without clicking "Stay Logged In"
   - Should be logged out automatically

2. **Activity Reset Test**:
   - Log in
   - Wait until warning appears
   - Click "Stay Logged In"
   - Warning should disappear
   - Timer should reset

3. **Session Duration Test**:
   - Log in
   - Wait 7 hours and 55 minutes (if max session is 8 hours, warning at 5 min)
   - Warning should appear for session duration
   - After 8 hours total, should be logged out

## Recommended Settings

### For Regular Users:
- Idle Timeout: 30 minutes
- Max Session: 8 hours
- Warning: 5 minutes before

### For Admin Users (More Strict):
- Idle Timeout: 15 minutes
- Max Session: 4 hours
- Warning: 3 minutes before

### For High Security:
- Idle Timeout: 10 minutes
- Max Session: 2 hours
- Warning: 2 minutes before

## Future Enhancements

Potential improvements:
1. **Per-User Configuration**: Different timeouts for different user roles
2. **Activity-Based Extension**: Automatically extend on certain activities
3. **Session History**: Track session durations and timeouts
4. **Multi-Tab Coordination**: Sync timeout across browser tabs
5. **Background Tab Detection**: Different timeout for background tabs

