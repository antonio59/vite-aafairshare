# Supabase Migrations

This directory contains SQL migration scripts for your Supabase database schema.

## Usage

- Place all migration SQL files in this directory, named with a timestamp and description, e.g.:
  - `2024-05-12-initial-schema.sql`
  - `2024-05-13-add-status-to-expenses.sql`

## Supabase CLI Migration Workflow

1. **Install the Supabase CLI:**
   > **Note:** Global install via `npm` or `pnpm` is no longer supported.
   > 
   > The recommended way on macOS is:
   ```sh
   brew install supabase/tap/supabase
   ```
   > For other platforms or advanced usage, see: https://github.com/supabase/cli#install-the-cli

2. **Login to Supabase:**
   ```sh
   supabase login
   ```

3. **Link your project:**
   ```sh
   supabase link --project-ref <your-project-ref>
   ```

4. **Generate a migration after making schema changes:**
   ```sh
   supabase db diff --schema public --file migrations/<timestamp>-<description>.sql
   ```

5. **Apply migrations to your database:**
   ```sh
   supabase db push
   ```

6. **Check migration status:**
   ```sh
   supabase db status
   ```

## References
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase CLI GitHub](https://github.com/supabase/cli#install-the-cli) 