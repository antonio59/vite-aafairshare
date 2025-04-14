# Component Organization Standards
## JSX to TSX Migration Guide

This document outlines the standards and best practices for organizing React components as we migrate from JSX to TypeScript.

## Directory Structure

Components should be organized in the following structure:

```
src/
├── components/            # Shared/reusable components
│   ├── Button/
│   │   ├── Button.tsx     # Main component
│   │   ├── Button.test.tsx  # Tests
│   │   ├── index.ts       # Re-export
│   │   └── types.ts       # Type definitions (if needed)
│   ├── ...
├── features/              # Feature-specific components
│   ├── Auth/
│   │   ├── components/    # Auth-specific components
│   │   ├── hooks/         # Auth-specific hooks
│   │   ├── utils/         # Auth-specific utilities
│   │   └── index.ts       # Public API
│   ├── ...
├── pages/                 # Page components
│   ├── HomePage/
│   │   ├── HomePage.tsx
│   │   └── index.ts
│   ├── ...
└── ...
```

## Migration Process

1. Use the provided `scripts/convert-jsx-to-tsx.js` script to automate the initial conversion.
2. Follow up manually to improve type definitions and fix any issues.
3. One component should exist in either JSX or TSX format, never both simultaneously.
4. ESLint rules have been added to prevent importing both JSX and TSX versions of the same component.

## TypeScript Component Standards

### Props and Interfaces

1. Define props using interfaces, not types:

```tsx
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// Avoid
type ButtonProps = {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
};
```

2. Export prop interfaces when they might be reused:

```tsx
// In Button.tsx or types.ts
export interface ButtonProps {
  // ...
}
```

3. Use React's built-in types when applicable:

```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}
```

### Function Components

1. Use named function declarations for components:

```tsx
// Preferred
function Button(props: ButtonProps) {
  return <button {...props} />;
}

// Also acceptable for exported components
export const Button = (props: ButtonProps) => {
  return <button {...props} />;
};
```

2. Use proper return type annotations:

```tsx
function Button(props: ButtonProps): JSX.Element {
  return <button {...props} />;
}

// Or use React.FC (though explicit props interface is still required)
const Button: React.FC<ButtonProps> = (props) => {
  return <button {...props} />;
};
```

### Default Props

For TypeScript components, use default parameters instead of the `defaultProps` pattern:

```tsx
// Preferred
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  // other props
}

function Button({ variant = 'primary', ...props }: ButtonProps) {
  // ...
}

// Avoid this pattern with TypeScript
Button.defaultProps = {
  variant: 'primary',
};
```

### Generics

When using generic components, provide clear constraints:

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T extends Record<string, any>>({ items, renderItem }: ListProps<T>): JSX.Element {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

## Import/Export Patterns

1. Use named exports for components:

```tsx
// Button.tsx
export function Button(props: ButtonProps) {
  // ...
}

// index.ts
export * from './Button';
```

2. For component reuse, create an index.ts file that re-exports components:

```tsx
// components/index.ts
export * from './Button';
export * from './Card';
// ...
```

## Testing

1. Use `.test.tsx` extension for component tests.
2. Ensure tests are migrated alongside components.

## Migration Checklist

When migrating a component from JSX to TSX:

1. Run the conversion script on the component
2. Review and improve auto-generated TypeScript interfaces
3. Update component function signature to use TypeScript
4. Fix any type errors in the component implementation
5. Update imports to use the new TSX component
6. Run tests to verify functionality
7. Update related documentation

Remember that the ESLint configuration will help identify and prevent issues during the migration process. 