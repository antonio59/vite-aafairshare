# Deployment Guide

## GitHub Branching Strategy

We use a simplified Git Flow approach with the following branches:

- **main**: Production branch that always reflects the live environment
- **develop**: Staging branch for testing before production
- **feature/***:  Short-lived branches for new features
- **bugfix/***:  Short-lived branches for bug fixes
- **hotfix/***:  Emergency fixes applied directly to main

### Branch Workflow:

1. Create feature/bugfix branches from `develop`
2. Open pull requests to merge back into `develop`
3. Periodically merge `develop` into `main` for production releases
4. Create hotfixes from `main` and merge back to both `main` and `develop`

## CI/CD Strategy

We use GitHub Actions for continuous integration and deployment:

### Pull Request Validation
- Triggered on any PR to any branch
- Runs linting, tests, and build verification
- Must pass before merging

### Deployment Workflow
- Triggered on pushes to `main` and `develop` branches
- Runs validation steps (lint, test, build)
- Deploys to appropriate Supabase environment:
  - `main` → Production

## Environment Setup

### Environment Variables
- Store sensitive environment variables in GitHub Repository Secrets
- Required secrets:
  - `SUPABASE_URL`: Supabase project URL
  - `SUPABASE_ANON_KEY`: Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### Supabase Projects
- **Production**: Linked to `main` branch

## Version Management

We follow semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)

### Dependencies
- Lock npm dependencies in package-lock.json
- Regularly update dependencies with security patches
- Schedule major dependency updates between feature releases

## Deployment Process

1. Merge feature branches to `develop` after PR approval
2. Test thoroughly on staging environment
3. Create a release PR from `develop` to `main`
4. After approval, merge to trigger production deployment
5. Tag the release with appropriate version 