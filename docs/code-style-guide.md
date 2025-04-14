# Code Style & Documentation Guide

## File Organization

### File & Directory Naming

- **Component Files**: Use PascalCase for component files (e.g., `ExpenseTable.tsx`)
- **Utility/Service Files**: Use kebab-case for utility files (e.g., `auth-service.ts`)
- **Feature Directories**: Group related components by feature in kebab-case directories (e.g., `expense-management/`)
- **Component Directories**: When using the directory pattern for components, match directory name to component name

### Directory Structure

```
src/
├── components/            # Shared/reusable components
│   ├── ui/                # Basic UI components
│   ├── [feature]/         # Feature-specific components
│   │   └── index.ts       # Re-export components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and constants
├── pages/                 # Page components
├── services/              # API and service layer
├── shared/                # Shared types and utilities
└── utils/                 # Helper functions
```

### Import Order

Order imports consistently:
1. External dependencies (React, libraries)
2. Internal absolute imports (@/components, etc.)
3. Relative imports (./component)
4. Types and interfaces
5. CSS/style imports

## Component Structure

### React Component Format

```tsx
/**
 * ComponentName Component
 * 
 * Brief description of what the component does.
 */

import React, { useState, useEffect } from 'react';
import { ComponentProps } from './types';

/**
 * ComponentName - [concise description]
 * 
 * [longer description if needed]
 * 
 * @example
 * <ComponentName prop1="value" prop2={123} />
 */
export function ComponentName({
  prop1,
  prop2,
  prop3 = 'default',
}: ComponentProps): JSX.Element {
  // Implementation
  return (
    <div>
      {/* Content */}
    </div>
  );
}
```

### Props & Types

- Define props using interfaces, not types
- Place prop interfaces in the same file or in a separate `types.ts` file for complex components
- Use explicit return types for components (e.g., `JSX.Element` or `React.ReactElement`)

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}
```

## Documentation Standards

### JSDoc Comments

All exported functions, components, and types should have JSDoc comments:

```tsx
/**
 * A brief description of what the function or component does.
 * 
 * @param param1 - Description of the first parameter
 * @param param2 - Description of the second parameter
 * @returns Description of the return value
 * 
 * @example
 * // Example usage
 * const result = myFunction('value', 123);
 */
```

### Required JSDoc Elements

1. **Components**:
   - Brief description
   - Props explanation
   - Example usage (for complex components)

2. **Hooks**:
   - Purpose of the hook
   - Parameters
   - Return value
   - Example usage

3. **Services/Utilities**:
   - Purpose
   - Parameters
   - Return value
   - Error cases (if applicable)

### General Code Documentation

- Add inline comments for complex logic
- Use TODO comments for future improvements (`// TODO: Implement X`)
- Document workarounds and edge cases

## Formatting & Style

### General Rules

- Use 2-space indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Limit line length to 100 characters
- Use trailing commas in multi-line arrays and objects

### Naming Conventions

- **Components**: PascalCase (`ExpenseTable`)
- **Functions**: camelCase (`fetchData`)
- **Variables**: camelCase (`userData`)
- **Constants**: UPPER_SNAKE_CASE for global constants (`API_URL`)
- **Interfaces/Types**: PascalCase, prefixed with 'I' for interfaces (`IUserData`)
- **Files**: Follow component/utility naming conventions

### TypeScript Best Practices

- Use type annotations for function parameters and return types
- Avoid `any` type where possible
- Use readonly for immutable properties
- Use union types instead of enums where appropriate

```tsx
type Status = 'idle' | 'loading' | 'success' | 'error';
```

## Performance Considerations 

- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` for expensive calculations and callbacks
- Avoid anonymous functions in render methods where possible

## Commit Message Format

Format: `<type>(<scope>): <subject>`

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code changes that neither fix bugs nor add features
- perf: Performance improvements
- test: Adding or fixing tests
- chore: Changes to the build process or auxiliary tools

Example: `feat(auth): implement Google sign-in` 