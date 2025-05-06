# Branching Strategy

This document outlines our simplified Git branching strategy for a single-production environment workflow.

## Branch Structure

| Branch Type | Naming Convention         | Description                                 | Source Branch | Target Branch |
|-------------|--------------------------|---------------------------------------------|---------------|---------------|
| Main        | `main`                   | Production-ready code, deployed to prod     | -             | -             |
| Feature     | `feature/<feature-name>` | New features or enhancements                | `main`        | `main`        |
| Hotfix      | `hotfix/<issue-name>`    | Critical fixes for production issues        | `main`        | `main`        |

## Workflow

### Feature Development

1. Create a feature branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/my-new-feature
   ```

2. Develop and commit changes to your feature branch:
   ```bash
   git add .
   git commit -m "feat: implement feature X"
   ```

3. Push your branch to GitHub and create a Pull Request to `main`:
   ```bash
   git push -u origin feature/my-new-feature
   ```

4. After review and approval, merge the feature branch into `main` using a squash merge.

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
4. After merging to `main`, tag the release if appropriate:
   ```bash
   git checkout main
   git pull
   git tag -a v1.0.1 -m "Version 1.0.1"
   git push --tags
   ```

## Branch Protection Rules

- `main` branch is protected and requires Pull Request reviews.
- Direct commits to `main` are prohibited.
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