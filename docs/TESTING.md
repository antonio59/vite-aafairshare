# Testing Documentation

## Local Development Setup

### Prerequisites
- Node.js (v18 or later)
- pnpm (v8 or later)
- Docker (for Supabase local development)

### Local Development Environment
1. **Supabase Local Setup**
   ```bash
   # Start Supabase locally
   pnpm supabase start
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Update environment variables for local development

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Building the Application
```bash
# Development build
pnpm build

# Production build
pnpm build:prod
```

## CI/CD Pipeline

### Test Environment
- **Supabase Test Project**: Used for CI/CD pipeline testing
- Environment variables are automatically set in the CI environment
- Test database is reset before each test run

### Running Tests in CI
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build application
pnpm build
```

## Edge Functions Testing

### Local Testing
```bash
# Start Supabase Edge Functions locally
pnpm supabase functions serve

# Test specific function
pnpm supabase functions serve --no-verify-jwt function-name
```

### Production Testing
- Edge Functions are tested in the staging environment before deployment
- Use the Supabase Dashboard to monitor function logs and performance

## Authentication Testing

### Google Sign-In Testing
- Test with allowed email addresses only
- Verify authentication state management
- Test sign-out functionality

### User Access Control
- Verify that only authorized users can access the application
- Test user session persistence
- Verify proper error handling for unauthorized access attempts

## Best Practices
1. Write tests for all new features
2. Maintain test coverage above 80%
3. Use meaningful test descriptions
4. Mock external services appropriately
5. Clean up test data after each test run 