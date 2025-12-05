# Authentication System

This document describes the username/password authentication system implemented in the ResponseReady app.

## Overview

The app now includes a complete authentication system that allows users to:
- Register with a username and password
- Login to access their personalized practice sessions
- Track user activity and usage
- View user statistics and activity logs

## Features

### User Registration
- Username (minimum 3 characters, alphanumeric + underscores/hyphens)
- Password (minimum 6 characters)
- Optional email address
- Automatic user ID generation

### User Login
- Username/password authentication
- Session management (persists across browser tabs)
- Automatic login state detection

### User Tracking
- Tracks all user activities (logins, page views, actions)
- Records timestamps and metadata for each action
- Stores user agent and URL information
- Activity statistics (total logins, sessions, action breakdowns)

### Admin Dashboard
- View all registered users
- See user activity logs
- View user statistics
- Track app usage patterns

## Implementation Details

### Storage
Currently uses **localStorage** for user data storage (MVP approach). This allows:
- Quick implementation without database setup
- Works immediately without additional infrastructure
- Easy migration path to database-backed storage

**Note**: For production with many users, consider migrating to a database (PostgreSQL, MongoDB, etc.)

### Security
- Passwords are hashed before storage (simple hash for MVP)
- **Production Recommendation**: Use bcrypt or similar for password hashing
- Sessions stored in sessionStorage and localStorage
- No password data exposed in client-side code

### User Activity Tracking
All user actions are tracked with:
- User ID
- Action type (login, logout, page_view, get_objection, add_response, etc.)
- Timestamp
- Metadata (action-specific data)
- User agent
- Current URL

## Usage

### For Users

1. **Register**: Click "Login" → "Don't have an account? Register"
2. **Login**: Enter username and password
3. **Access App**: Once logged in, your session persists
4. **View Profile**: Click your username in the header → "Profile"
5. **Logout**: Click your username → "Logout"

### For Administrators

1. **Access Admin Dashboard**: Navigate to `/admin`
2. **View Users**: See all registered users in the left panel
3. **View Activity**: Click a user to see their activity log
4. **View Statistics**: See login counts, session counts, and activity breakdowns

## Routes

- `/auth` - Login/Register page
- `/admin` - Admin dashboard for viewing user activity
- `/` - Main app (shows login if not authenticated, or can be made optional)

## API Functions

### Authentication (`lib/auth.ts`)

```typescript
// Register a new user
registerUser(username: string, password: string, email?: string): User

// Authenticate user
authenticateUser(username: string, password: string): User | null

// Get current user
getCurrentUser(): User | null

// Set current user session
setCurrentUser(user: User): void

// Clear current user session
clearCurrentUser(): void

// Check if authenticated
isAuthenticated(): boolean

// Get current user ID
getCurrentUserId(): string | null

// Track user activity
trackUserActivity(userId: string, action: string, metadata?: Record<string, any>): void

// Get user activities
getUserActivities(userId?: string): Activity[]

// Get user statistics
getUserStats(userId: string): UserStats

// Get all users (admin)
getAllUsers(): User[]
```

## Components

### `LoginForm`
- Username/password input
- Error handling
- Link to registration

### `RegisterForm`
- Username, email (optional), password, confirm password
- Validation
- Success feedback

### `AuthGuard`
- Wraps app content
- Shows login/register if not authenticated
- Redirects authenticated users to app

### `UserMenu`
- User avatar/username in header
- Dropdown with profile, activity, logout options
- Shows "Login" button if not authenticated

### `UserProfile`
- Displays user information
- Shows activity statistics
- Logout functionality

## Making Auth Optional

Currently, authentication is **optional** - users can still use the app without logging in. To make it required:

1. Wrap the main app content with `AuthGuard`:
```tsx
// In app/page.tsx or app/layout.tsx
import AuthGuard from '@/components/AuthGuard';

export default function Home() {
  return (
    <AuthGuard>
      {/* Your app content */}
    </AuthGuard>
  );
}
```

## Migration to Database

To migrate from localStorage to a database:

1. **Set up database** (PostgreSQL recommended for Heroku)
2. **Create user table**:
   ```sql
   CREATE TABLE users (
     id VARCHAR PRIMARY KEY,
     username VARCHAR UNIQUE NOT NULL,
     email VARCHAR,
     password_hash VARCHAR NOT NULL,
     created_at TIMESTAMP NOT NULL,
     last_login_at TIMESTAMP,
     is_active BOOLEAN DEFAULT true
   );
   ```

3. **Create activity table**:
   ```sql
   CREATE TABLE user_activities (
     id SERIAL PRIMARY KEY,
     user_id VARCHAR REFERENCES users(id),
     action VARCHAR NOT NULL,
     metadata JSONB,
     timestamp TIMESTAMP NOT NULL,
     user_agent TEXT,
     url TEXT
   );
   ```

4. **Update `lib/auth.ts`** to use database queries instead of localStorage
5. **Update activity tracking** to write to database

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Remember me / persistent sessions
- [ ] Two-factor authentication
- [ ] User roles and permissions
- [ ] Export user data
- [ ] Account deletion
- [ ] Session management (view/revoke active sessions)
- [ ] Database migration
- [ ] API rate limiting per user
- [ ] User preferences/settings

## Security Considerations

1. **Password Hashing**: Currently uses simple hash - upgrade to bcrypt for production
2. **Session Security**: Consider using HTTP-only cookies for sessions
3. **API Keys**: Keep sensitive keys server-side, not in `NEXT_PUBLIC_*` vars
4. **Rate Limiting**: Implement login attempt limits
5. **Input Validation**: All user inputs are validated
6. **XSS Protection**: React automatically escapes content
7. **CSRF Protection**: Consider adding CSRF tokens for forms

## Troubleshooting

### "Username already exists"
- The username is already taken. Choose a different one.

### "Invalid username or password"
- Check your credentials
- Ensure username and password are correct
- Passwords are case-sensitive

### Session not persisting
- Check browser localStorage/sessionStorage is enabled
- Clear browser cache and try again
- Check for browser extensions blocking storage

### Can't see users in admin
- Ensure you're logged in
- Users are stored in localStorage - check browser storage
- Clear storage and register new users

## Support

For issues or questions about the authentication system, check:
- Browser console for errors
- localStorage in browser DevTools
- User data in `response-ready-users` key
- Activity data in `response-ready-user-activity` key

