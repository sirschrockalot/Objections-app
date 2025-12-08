# Testing Guide

This document describes the test suite for the Objections-app application.

## Test Setup

The application uses:
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (with coverage, optimized for CI)
npm run test:ci
```

## Test Structure

Tests are organized in the `__tests__` directory:

```
__tests__/
├── api/
│   ├── auth/
│   │   ├── login.test.ts          # Login API endpoint tests
│   │   ├── register.test.ts       # Registration API endpoint tests
│   │   └── users.test.ts          # User management API tests
│   └── data/
│       ├── stats.test.ts          # Stats API endpoint tests
│       └── custom-responses.test.ts # Custom responses API tests
├── components/
│   ├── LoginForm.test.tsx         # LoginForm component tests
│   └── AuthGuard.test.tsx         # AuthGuard component tests
└── lib/
    ├── auth.test.ts               # Authentication utility tests
    └── storage.test.ts             # Storage utility tests
```

## Test Coverage

### Current Coverage

- **API Routes**: Authentication and data endpoints
- **Components**: LoginForm, AuthGuard
- **Utilities**: Authentication and storage functions

### Coverage Thresholds

- **Global**: 30% minimum (increasing over time)
- **Critical Paths** (`/app/api/auth/`, `lib/auth.ts`): 60% minimum

View detailed coverage reports:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Test Categories

### API Endpoint Tests

#### Authentication Routes
- ✅ `/api/auth/login` - Login validation, error handling, success flow
- ✅ `/api/auth/register` - Registration validation, duplicate checks, success flow
- ✅ `/api/auth/users` - Admin user management (list, create)

#### Data Routes
- ✅ `/api/data/stats` - Comprehensive stats aggregation
- ✅ `/api/data/custom-responses` - Custom response CRUD operations
- ⏳ `/api/data/practice-sessions` - Practice session management (to be added)
- ⏳ `/api/data/points` - Points and gamification (to be added)
- ⏳ `/api/data/review-schedules` - Spaced repetition (to be added)

### Component Tests
- ✅ `LoginForm` - Form validation, submission, error handling
- ✅ `AuthGuard` - Authentication flow, password change requirement
- ⏳ `UserManagementForm` - Admin user form (to be added)
- ⏳ `ForcePasswordChangeModal` - Password change flow (to be added)

### Utilities
- ✅ `lib/auth.ts` - Authentication functions
- ✅ `lib/storage.ts` - Storage operations

## Writing New Tests

### API Route Tests

```typescript
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/lib/models/User');

// Helper to create NextRequest
function createNextRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const { method = 'GET', body, headers = {} } = options;
  return new NextRequest(new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

describe('/api/auth/login', () => {
  it('should handle request correctly', async () => {
    const request = createNextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: { username: 'test@example.com', password: 'password123' },
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('should handle user interactions', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/test.yml` for CI configuration.

## Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/lcov-report/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI/CD tools)
- **JSON Summary**: `coverage/coverage-summary.json`

## Best Practices

1. **Test Behavior, Not Implementation** - Focus on what the code does, not how it does it
2. **Use Descriptive Test Names** - Test names should clearly describe what is being tested
3. **Mock External Dependencies** - Mock database, API calls, and browser APIs
4. **Test Error Cases** - Don't just test happy paths
5. **Keep Tests Isolated** - Each test should be independent
6. **Use Appropriate Assertions** - Use specific matchers from `@testing-library/jest-dom`
7. **Test User Interactions** - Use `@testing-library/user-event` for realistic interactions

## Troubleshooting

### Tests failing with "Request is not defined"
- Ensure `jest.setup.js` includes Request/Response mocks
- Check that Next.js server components are properly mocked

### Component tests failing
- Check that components are properly exported
- Verify React Testing Library setup
- Ensure proper mocking of Next.js router and framer-motion

### Database-related test failures
- All database operations should be mocked
- Use `jest.mock()` to mock Mongoose models
- Mock `connectDB` from `@/lib/mongodb`

### Coverage thresholds not met
- Run `npm run test:coverage` to see detailed coverage
- Focus on adding tests for uncovered critical paths
- Gradually increase thresholds as coverage improves

## Next Steps

1. ✅ Fixed component tests to match actual implementation
2. ✅ Added API route tests for stats and custom-responses
3. ✅ Set up coverage reporting with thresholds
4. ⏳ Add more component tests (UserManagementForm, etc.)
5. ⏳ Add integration tests for full user flows
6. ⏳ Increase coverage for data routes
7. ⏳ Add E2E tests with Playwright or Cypress (optional)
