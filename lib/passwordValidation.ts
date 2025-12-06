/**
 * Password validation utility
 * Enforces strong password policy:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a password against the security policy
 * @param password - The password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required',
    };
  }

  if (password.length < 12) {
    return {
      valid: false,
      error: 'Password must be at least 12 characters',
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }

  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character (@$!%*?&)',
    };
  }

  return { valid: true };
}

/**
 * Gets a comprehensive error message for password requirements
 * Useful for displaying to users before they submit
 */
export function getPasswordRequirementsMessage(): string {
  return 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character (@$!%*?&)';
}

