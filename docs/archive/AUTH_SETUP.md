# Authentication System Setup

This document provides instructions for setting up and configuring the authentication system for the Asset Management Application.

## Prerequisites

- Node.js 18 or later
- PostgreSQL database
- pnpm package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/asset_management"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# App
NODE_ENV="development"
```

## Database Setup

1. Make sure PostgreSQL is running
2. Run the following commands to set up the database:

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Push schema to database
pnpm prisma:push

# Seed the database with initial data
pnpm prisma:seed
```

## Development

Start the development server:

```bash
pnpm dev
```

## Default Admin User

After seeding the database, you can log in with the following credentials:

- **Email:** admin@npc.gov.ng
- **Password:** admin123

## Authentication Flow

The application uses NextAuth.js with the following features:

- Email/password authentication
- Role-based access control (RBAC)
- Session management
- Protected routes

## Available User Roles

1. **VIEWER** - Can view assets and basic reports
2. **OPERATOR** - Can manage assets and view reports
3. **MANAGER** - Can manage assets, categories, and view all reports
4. **ADMIN** - Full access to all features except user management
5. **SUPER_ADMIN** - Full system access including user management

## API Routes

- `/api/auth/*` - NextAuth.js authentication routes
- `/api/users/*` - User management (protected)
- `/api/assets/*` - Asset management (protected)

## Security Considerations

- Always use HTTPS in production
- Keep your `NEXTAUTH_SECRET` secure and never commit it to version control
- Regularly update dependencies to patch security vulnerabilities
- Implement rate limiting for authentication endpoints
- Use strong password policies
- Regularly audit user accounts and permissions

## Troubleshooting

### Database Connection Issues

1. Verify that PostgreSQL is running
2. Check the `DATABASE_URL` in your `.env` file
3. Ensure the database user has the correct permissions

### Authentication Issues

1. Clear browser cookies and local storage
2. Check the server logs for error messages
3. Verify that the user account is active

### Development Tips

- Use the Prisma Studio to inspect the database:
  ```bash
  npx prisma studio
  ```
- Check the browser's developer console for client-side errors
- Check the terminal where the Next.js server is running for server-side errors
