# Data Migration Scripts

This directory contains scripts to help migrate data from Firebase to Supabase.

## User Migration

### Prerequisites

1. Install required dependencies:
```bash
pnpm add firebase-admin @supabase/supabase-js dotenv
```

2. Get your Firebase service account key:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in the `scripts` directory

3. Ensure your `.env` file has the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Add "type": "module" to your package.json:
```json
{
  "type": "module"
}
```

### Running the Migration

1. Run the user migration script:
```bash
node scripts/migrate-users.js
```

The script will:
- Connect to Firebase using your service account
- Fetch all users from Firebase Auth
- Transform the user data to match Supabase's schema
- Insert/update users in Supabase
- Log the progress and any errors

### What Gets Migrated

The following user data is migrated:
- User ID (uid)
- Email
- Display Name (as username)
- Photo URL
- Creation Time
- Last Sign In Time
- Anonymous Status

### Notes

- The script uses `upsert` to handle existing users (matched by email)
- All timestamps are converted to ISO format
- The script maintains the original Firebase UID for reference
- Any errors during migration are logged but won't stop the process

### Troubleshooting

If you encounter any issues:

1. **Module not found errors**:
   - Make sure you've installed all dependencies
   - Verify that "type": "module" is in your package.json

2. **Firebase authentication errors**:
   - Verify your service account JSON file is valid
   - Check that the file is in the correct location

3. **Supabase connection errors**:
   - Verify your environment variables are set correctly
   - Check that your Supabase URL and anon key are valid 