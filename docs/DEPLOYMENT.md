# Deployment Strategy

This document outlines our git workflow, CI/CD pipelines, and deployment strategy for the FairShare application.

## Git Branch Strategy

We follow a simplified GitFlow workflow with the following branches:

- `main`: Production-ready code that is deployed to the live environment
- `develop`: Integration branch for features to be tested in the staging environment
- `feature/*`: Feature branches for development work
- `hotfix/*`: Hotfix branches for critical production fixes

### Workflow:

1. Create a feature branch from `develop` using the format `feature/feature-name`
2. Develop and test your feature locally
3. Create a pull request to merge your feature branch into `develop`
4. After code review and approval, merge into `develop` (triggers staging deployment)
5. Test features in the staging environment
6. When ready for release, create a PR from `develop` to `main`
7. After final review, merge into `main` (triggers production deployment)

For urgent fixes:
1. Create a hotfix branch from `main` using the format `hotfix/issue-description`
2. Implement and test the fix
3. Create a PR to merge into both `main` and `develop`

## CI/CD Pipeline

We use GitHub Actions to automate our testing and deployment workflows:

### Workflows:

1. **Pull Request Checks** (runs on PR to `develop` or `main`):
   - Run linting
   - Run unit tests
   - Build application

2. **Staging Deployment** (runs on push to `develop`):
   - Run linting and tests
   - Build application with staging env variables
   - Deploy to Firebase Hosting (staging environment)
   - Deploy Firestore and Storage rules
   - Run E2E tests against staging environment
   - Notify team of successful deployment

3. **Production Deployment** (runs on push to `main`):
   - Run linting and tests
   - Build application with production env variables
   - Create a version tag based on package.json
   - Deploy to Firebase Hosting (production environment)
   - Deploy Firestore and Storage rules
   - Create a GitHub release
   - Run E2E tests against production environment
   - Notify team of successful deployment

## Environments

### Staging Environment
- URL: https://staging.fairshare.app
- Firebase Project: fairshare-staging
- Purpose: Testing new features before production release
- Configuration: Uses staging environment variables

### Production Environment
- URL: https://fairshare.app
- Firebase Project: fairshare-prod
- Purpose: Live application for end users
- Configuration: Uses production environment variables

## Version Management

We follow Semantic Versioning (SemVer) for our application releases:

- **Major version** (X.0.0): Breaking changes or significant new features
- **Minor version** (X.Y.0): New features with backward compatibility
- **Patch version** (X.Y.Z): Bug fixes and minor improvements

The version is managed in the `package.json` file and used to create release tags.

## Firebase Configuration

### Firebase Features Used:
- Firebase Hosting for web application
- Firestore for database
- Firebase Storage for file storage
- Firebase Authentication for user management

### Deployment Setup:
1. We use separate Firebase projects for staging and production
2. Environment-specific configuration is stored in GitHub Secrets
3. Firebase service accounts are configured as secrets in GitHub
4. Firebase rules are versioned in the repository and deployed with the application

## Required GitHub Secrets

The following secrets need to be configured in the GitHub repository:

### Staging Environment:
- `FIREBASE_SERVICE_ACCOUNT_STAGING`: Firebase service account for staging
- `STAGING_FIREBASE_API_KEY`, `STAGING_FIREBASE_AUTH_DOMAIN`, etc.

### Production Environment:
- `FIREBASE_SERVICE_ACCOUNT_PROD`: Firebase service account for production
- `PROD_FIREBASE_API_KEY`, `PROD_FIREBASE_AUTH_DOMAIN`, etc.

### Notifications:
- `SLACK_WEBHOOK`: Webhook URL for Slack notifications

## Manual Deployments

In case of need, manual deployments can be triggered using the workflow_dispatch event in GitHub Actions:

1. Go to the Actions tab in GitHub
2. Select the workflow (Staging or Production)
3. Click "Run workflow" and select the branch
4. Fill in any required parameters
5. Click "Run workflow" to start the deployment 