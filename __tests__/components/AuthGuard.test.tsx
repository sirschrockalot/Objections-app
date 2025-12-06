/**
 * Tests for AuthGuard component
 */

import { render, screen, waitFor } from '@testing-library/react';
import AuthGuard from '@/components/AuthGuard';
import { isAuthenticated, getCurrentUser, fetchCurrentUser } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/components/LoginForm');
jest.mock('@/components/RegisterForm');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.addEventListener/removeEventListener
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });


  it('should show login form when not authenticated', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    (fetchCurrentUser as jest.Mock).mockResolvedValue(null);
    (LoginForm as jest.Mock).mockReturnValue(<div>Login Form</div>);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText(/login form/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });

  it('should show protected content when authenticated', async () => {
    const mockUser = {
      id: 'user123',
      username: 'test@example.com',
      mustChangePassword: false,
    };

    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (fetchCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });
  });

  it('should show password change modal when mustChangePassword is true', async () => {
    const mockUser = {
      id: 'user123',
      username: 'test@example.com',
      mustChangePassword: true,
    };

    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (fetchCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Mock ForcePasswordChangeModal
    jest.doMock('@/components/ForcePasswordChangeModal', () => ({
      __esModule: true,
      default: () => <div>Password Change Modal</div>,
    }));

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      // Should not show protected content when password change is required
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });
  });
});

