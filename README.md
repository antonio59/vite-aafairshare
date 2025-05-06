# FairShare Expense Sharing App

A modern expense sharing application designed for two users to track and split expenses, built with React, TypeScript, Supabase, and Netlify.

## Features

- 🔐 Google Authentication (via Supabase)
- 💰 Track and categorize expenses
- 📊 Visualize spending patterns with charts
- 🔄 Split expenses equally (50/50) or assign to one user (100%)
- 📱 Responsive design for mobile and desktop
- 📆 Monthly expense tracking and settlement

## Architecture Overview

### Tech Stack

- **Frontend**: React 18 with TypeScript, built using Vite
- **State Management**: React Context + React Query for server state
- **UI Components**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Backend**: Supabase (Postgres, Auth)
- **Hosting**: Netlify
- **Routing**: React Router v7

### Core Architecture Concepts

#### Two-User System
The application is designed specifically for two users to share expenses:
- Simplified user management
- Split types limited to 50/50 or 100%
- Straightforward settlement calculations

#### Component Architecture
- **Container/Presentation Pattern**: Separates data fetching from UI rendering
- **Lazy Loading**: Improves initial load time with component code splitting
- **Memo & Optimization**: Performance optimized for larger datasets

#### Data Flow
- **Context Providers**: Domain-specific contexts (User, Resources)
- **Custom Hooks**: Abstracted data fetching and state management
- **Service Layer**: Supabase operations abstracted through service modules

#### Type System
- Centralized type definitions in shared directory
- Consistent use of TypeScript interfaces
- Strong typing throughout the application

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Netlify account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/fairshare.git
cd fairshare
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase configuration:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

4. Start the development server
```bash
npm run dev
```

## Project Structure

```
src/
├── components/      # UI components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configuration
├── pages/           # Page components
├── services/        # API and Supabase services
└── shared/          # Shared types and utilities
```

## Scripts & Automation

This project uses a unified GitHub Actions workflow for deploying to production using npm and Netlify.

### Deployment Workflow

- **Unified Workflow:**
  - The `.github/workflows/deploy.yml` workflow handles production deployments.
  - **Push to `main` branch:** Deploys to the production Netlify site and applies Supabase migrations if present.
  - The workflow uses npm for dependency management and build, and deploys via Netlify CLI/API.

#### How to Deploy
- **To deploy to production:**
  1. Merge or push your changes to the `main` branch.
  2. The workflow will build and deploy to the production Netlify environment and apply any new Supabase migrations.

#### Example Workflow File
See `.github/workflows/deploy.yml` for the full configuration.

### Other Scripts

- **Supabase Migrations**
  - **What it does:** Manages schema changes for your database using SQL migration files in `/migrations`.
  - **How to run:**
    ```sh
    supabase db push
    ```
    See `/migrations/README.md` for details.

## Environment Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_KEY` - Your Supabase anon/public key

## Branching Strategy

- All development and hotfixes are branched from `main`.
- See `docs/BRANCHING_STRATEGY.md` for details.

## Monitoring & Analytics

- Supabase logs and analytics for user metrics and performance
- Custom application logging for detailed debugging

## License

MIT