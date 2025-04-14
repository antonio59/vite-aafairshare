# Branching Strategy

This document outlines our Git branching strategy to ensure a consistent, reliable, and maintainable development workflow.

## Branch Structure

| Branch Type | Naming Convention | Description | Source Branch | Target Branch |
|-------------|-------------------|-------------|---------------|---------------|
| Main | `main` | Production-ready code that has been deployed to production | - | - |
| Development | `develop` | Integration branch for features and bug fixes before promotion to production | `main` | `main` |
| Feature | `feature/<feature-name>` | New features or enhancements | `develop` | `develop` |
| Bugfix | `bugfix/<bug-name>` | Fixes for bugs in existing functionality | `develop` | `develop` |
| Hotfix | `hotfix/<issue-name>` | Critical fixes for production issues | `main` | `main` & `develop` |
| Release | `release/v<version>` | Preparation for a new production release | `develop` | `main` & `develop` |

## Workflow

### Feature Development

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/my-new-feature
   ```

2. Develop and commit changes to your feature branch:
   ```bash
   git add .
   git commit -m "feat: implement feature X"
   ```

3. Push your branch to GitHub and create a Pull Request to `develop`:
   ```bash
   git push -u origin feature/my-new-feature
   ```

4. After review and approval, merge the feature branch into `develop` using a squash merge.

### Bug Fixes

1. Create a bugfix branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b bugfix/issue-description
   ```

2. Fix the bug and commit changes:
   ```bash
   git add .
   git commit -m "fix: resolve issue with X"
   ```

3. Push your branch and create a Pull Request to `develop`.

### Hotfixes

For critical production issues:

1. Create a hotfix branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-issue
   ```

2. Fix the issue and commit changes:
   ```bash
   git add .
   git commit -m "fix: resolve critical production issue"
   ```

3. Push your branch and create a Pull Request to `main`.
4. After merging to `main`, ensure the fix is also applied to `develop`.

### Releases

1. When `develop` is ready for release:
   ```bash
   git checkout develop
   git pull
   git checkout -b release/v1.0.0
   ```

2. Make any final adjustments, bump version numbers, and prepare release notes.

3. Create Pull Requests to both `main` and `develop`.

4. After merging to `main`, tag the release:
   ```bash
   git checkout main
   git pull
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push --tags
   ```

## Branch Protection Rules

- `main` and `develop` branches are protected and require Pull Request reviews.
- Direct commits to `main` and `develop` are prohibited.
- CI checks must pass before merging.
- Linear history is maintained through squash merging.

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): implement Google sign-in functionality

Adds Google OAuth integration for user authentication.

Closes #123
``` 