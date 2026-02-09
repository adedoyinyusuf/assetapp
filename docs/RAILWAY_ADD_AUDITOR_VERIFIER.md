# Adding Auditor Verifier User to Railway Production

This guide explains how to add the Auditor Verifier user to your Railway production database.

## Option 1: Run via Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run the seed script on Railway**:
   ```bash
   railway run npm run seed:auditor-verifier
   ```

## Option 2: Run via Railway Dashboard

1. Go to your Railway project dashboard
2. Navigate to your service
3. Click on the **"Settings"** tab
4. Scroll down to **"Deploy Triggers"**
5. Add a new **"Custom Start Command"** (temporarily):
   ```bash
   npm run seed:auditor-verifier && npm start
   ```
6. Trigger a new deployment
7. After successful deployment, **remove** the custom start command and redeploy with the normal start command

## Option 3: Manual Database Connection

If you have direct database access:

1. **Get your Railway database URL** from the Railway dashboard variables
2. **Set the DATABASE_URL** environment variable locally:
   ```bash
   set DATABASE_URL=your_railway_database_url
   ```
   or on Linux/Mac:
   ```bash
   export DATABASE_URL=your_railway_database_url
   ```

3. **Run the script**:
   ```bash
   npm run seed:auditor-verifier
   ```

## Credentials

After running the script, the following user will be created:

- **Email**: `auditor.verifier@npopc.gov.ng`
- **Password**: `Auditor@123`
- **Role**: AUDITOR_VERIFIER

## Verification

To verify the user was created successfully:

1. Try logging in on your Railway production URL with the credentials above
2. Check that you can access:
   - `/dashboard`
   - `/stock-verification`
   - `/assets`
   - `/reports`

## Troubleshooting

### Script fails with "Role not found"
The AUDITOR_VERIFIER role might not exist in your production database. Run migrations first:
```bash
railway run npm run prisma:migrate:deploy
```

### Connection timeout
Your Railway database might have connection limits. Try running the script during off-peak hours.

### Permission denied
Ensure your DATABASE_URL has write permissions to the database.
