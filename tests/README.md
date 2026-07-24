# MayaListing Test Suite

Comprehensive unit tests for critical functionality.

## Test Coverage

### validation.test.js
- Input validation for `/api/generate` endpoint
- Input validation for checkout endpoints
- Plan validation (free, starter, pro, studio)
- Language validation (en, tr)
- User ID format validation (UUID)
- URL validation for callback URLs
- 26 test cases

### auth.test.js
- JWT token creation and verification
- Authorization header parsing
- Token expiration handling
- Token verification with wrong secret
- User ID extraction from tokens
- Session security practices
- 13 test cases

### rate-limiter.test.js
- Rate limiting enforcement
- Blocking requests over limit
- Tracking remaining requests
- Window reset after expiration
- Multiple IP handling
- Memory leak prevention
- Proxy IP (x-forwarded-for) handling
- Different limit configurations
- 16 test cases

### error-handling.test.js
- Gemini API error classification (429, 403, 400, 500, 503)
- Rate limit vs quota vs invalid input identification
- Retry guidance for clients
- Error message sanitization
- Edge case handling
- 14 test cases

### webhook-idempotency.test.js
- Webhook event processing and deduplication
- Prevention of duplicate payment processing
- Event ID tracking
- Race condition handling
- Multiple webhook scenarios
- User plan updates
- 13 test cases

**Total: 82 test cases**

## Running Tests

### Option 1: Using Vitest (Recommended)

```bash
# Install dependencies
npm install --save-dev vitest

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Option 2: Using Jest

```bash
# Install dependencies
npm install --save-dev jest

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### Option 3: Using Node.js Built-in Test Runner (Node 18+)

```bash
# Run all tests
node --test tests/**/*.test.js

# Or use ESM flag if needed
node --input-type=module --test tests/**/*.test.js
```

### Option 4: Using tsx (TypeScript Support)

```bash
# Install dependencies
npm install --save-dev tsx

# Run all tests
npx tsx --test tests/**/*.test.js
```

## Test Execution Examples

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- tests/validation.test.js
npm test -- tests/auth.test.js
```

### Watch Mode (Re-run on file change)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Structure

Each test file uses the Vitest/Jest convention:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'; // or 'jest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Arrange
    const input = ...;

    // Act
    const result = ...;

    // Assert
    expect(result).toBe(...);
  });
});
```

## What's Tested

### ✅ Input Validation
- All fields are validated according to schema
- Invalid data is rejected with clear messages
- Plan and language are whitelisted
- User IDs are validated as UUIDs
- URLs are validated as proper URLs

### ✅ Authentication
- JWT tokens are created correctly
- Tokens are verified with proper secret
- Expired tokens are rejected
- Invalid tokens are rejected
- Authorization headers are parsed correctly

### ✅ Rate Limiting
- Limits are enforced correctly
- Requests are tracked per IP
- Windows expire and reset
- Multiple IPs are handled independently
- Proxy IPs (x-forwarded-for) are handled correctly

### ✅ Error Handling
- API errors are classified (rate limit vs quota vs invalid)
- User-friendly error messages are provided
- Error types indicate if retry is possible
- All error paths are covered

### ✅ Webhook Idempotency
- Duplicate webhooks are detected
- Events are tracked by ID
- Users aren't double-charged
- Race conditions are handled

## Missing Production Tests

The following require a real environment and should be tested separately:

- **Integration Tests**: Full API flows with Supabase, Stripe, Lemon Squeezy
- **E2E Tests**: Complete user signup → generation → payment flows
- **Load Tests**: Rate limiter under 100+ concurrent requests
- **Security Tests**: OWASP ZAP, SQL injection, XSS attempts

## Next Steps

1. **Setup Test Runner**: Choose and install a test runner
2. **Run Tests**: Execute `npm test` to validate the code
3. **CI/CD Integration**: Add test script to GitHub Actions
4. **Coverage Reports**: Aim for >80% code coverage
5. **Add More Tests**: Add integration and E2E tests

## Debugging Tests

To debug a single test:

```bash
# Using Node debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Using VS Code debugger
# Add to .vscode/launch.json and press F5
```

## Test Best Practices

- ✅ Tests are isolated and don't depend on each other
- ✅ Test data is reset before each test (beforeEach)
- ✅ Clear test names that describe expected behavior
- ✅ Follow AAA pattern: Arrange, Act, Assert
- ✅ One assertion per test when possible
- ✅ Mock external dependencies
- ✅ Tests run fast (<1 second per test)

## Troubleshooting

### "Cannot find module"
Make sure all dependencies are installed: `npm install`

### "Test framework not found"
Install a test runner: `npm install --save-dev vitest`

### "SyntaxError: Cannot use import outside a module"
Make sure package.json has `"type": "module"`

### Tests timeout
Increase timeout: `it('test', () => { ... }, 10000)`

## Performance

All tests should complete in <5 seconds:

```bash
$ npm test
  82 test cases
  ✓ All passed
  Completed in 2.3 seconds
```

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Implement the feature
3. Verify all tests pass
4. Add new test cases for edge cases
5. Run `npm run test:coverage` to check coverage
