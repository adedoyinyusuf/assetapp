# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the National Population Commission (NPC) Asset Management System - a comprehensive, enterprise-grade solution built with Next.js 14 (App Router), TypeScript, Prisma ORM, and PostgreSQL. It features real-time updates, advanced analytics, AI-powered search, and role-based access control.

## Key Development Commands

### Setup and Installation
```bash
# First-time setup
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:setup

# Generate Prisma client and push schema
npm run prisma:generate
npm run prisma:push

# Optional: Seed database with sample data
npm run prisma:seed
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build
npm start

# Database management
npm run prisma:studio          # Open Prisma Studio (database GUI)
npm run prisma:migrate         # Create new migration
npm run prisma:migrate:deploy  # Deploy migrations
npm run db:reset              # Reset database (careful!)

# Testing
npm test                      # Run tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage
npm run test:ci             # Run tests for CI

# Code Quality
npm run lint                 # Check linting
npm run lint:fix            # Fix linting issues
npm run type-check          # TypeScript type checking
npm run format              # Format code with Prettier
npm run format:check        # Check formatting
```

### Single Test Execution
```bash
# Run specific test file
npm test -- app/__tests__/hello.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="specific test name"
```

## Architecture Overview

### Database Architecture
- **ORM**: Prisma with PostgreSQL
- **Key Models**: Asset, Category, User, UserRole, AssetMovement, Depreciation
- **Authentication**: NextAuth.js with custom user/role tables
- **Role System**: Hierarchical with VIEWER → OPERATOR → MANAGER → AUDITOR → ADMIN → SUPER_ADMIN

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context for dashboard state
- **Real-time**: Socket.IO WebSocket client
- **Charts**: Recharts for analytics visualization

### Backend Architecture
- **API Routes**: Next.js API routes in `/app/api/`
- **Middleware**: Custom authentication and role-based access control
- **Real-time Server**: WebSocket server for live updates
- **Analytics**: Comprehensive analytics service with trend analysis

### Role-Based Access Control (RBAC)
The system uses a sophisticated permission system defined in `lib/auth/roles.ts`:
- **Hierarchical Roles**: Each role inherits permissions from lower roles
- **Task-Based Permissions**: Granular control with specific tasks
- **Route Protection**: Middleware enforces role-based route access
- **Component-Level**: `PermissionGate` component for UI permission checks

### Real-Time Features
- **WebSocket Service**: Client-side service in `lib/websocket.ts`
- **Event Types**: asset_update, user_activity, system_notification, depreciation_update
- **Room-based Broadcasting**: Users join rooms based on their role/department
- **Connection Management**: Automatic reconnection with exponential backoff

## Key File Structure Patterns

### App Router Structure
```
app/
├── api/                    # API endpoints
│   ├── auth/              # Authentication routes
│   ├── admin/             # Admin-only endpoints
│   └── reports/           # Report generation
├── dashboard/             # Main dashboard
├── assets/                # Asset management pages
├── reports/               # Reports and analytics
└── unauthorized/          # Access denied page
```

### Component Organization
```
components/
├── ui/                    # shadcn/ui components
├── dashboard/             # Dashboard-specific components
├── PermissionGate.tsx     # Role-based component visibility
├── ProtectedRoute.tsx     # Route-level protection
└── AdvancedAnalytics.tsx  # Analytics dashboard
```

### Authentication Flow
1. Login through NextAuth.js custom pages
2. JWT tokens with role information
3. Middleware validates tokens and checks route permissions
4. Components use `PermissionGate` for conditional rendering
5. API routes validate permissions server-side

### Database Schema Patterns
- All tables use snake_case naming convention
- Timestamps: `created_at`, `updated_at`
- Foreign keys follow pattern: `{table}_id`
- Soft deletes with `is_active` boolean flags
- Audit logging with `AuditLog` model

## Environment Configuration

### Required Environment Variables
```env
# Core
DATABASE_URL="postgresql://user:password@localhost:5432/asset_management"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Features (optional but recommended)
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
ENABLE_WEBSOCKET="true"
ENABLE_REAL_TIME_UPDATES="true"
ENABLE_ADVANCED_ANALYTICS="true"
ENABLE_AI_SEARCH="true"
```

## Testing Strategy

- **Unit Tests**: Jest with ts-jest for TypeScript support
- **Test Location**: `app/__tests__/` directory
- **Coverage**: Configured to generate lcov reports in `coverage/`
- **CI Integration**: `npm run test:ci` for automated testing

## Development Guidelines

### Database Changes
1. Create migration: `npm run prisma:migrate`
2. Update schema in `prisma/schema.prisma`
3. Generate client: `npm run prisma:generate`
4. Update TypeScript types as needed

### Adding New Roles/Permissions
1. Update `UserRole` enum in `lib/auth/roles.ts`
2. Add permissions to `taskPermissions` mapping
3. Update middleware route matching if needed
4. Add role to database seed data

### Real-Time Features
1. Define new event types in `lib/websocket.ts`
2. Add server-side event emission in API routes
3. Subscribe to events in React components
4. Handle connection states gracefully

### Analytics Development
1. Add new metrics to `lib/analytics.ts`
2. Create database queries using Prisma
3. Update TypeScript interfaces
4. Add visualizations in `AdvancedAnalytics.tsx`

## Important Security Considerations

- All API routes must validate user permissions
- Use `PermissionGate` for sensitive UI components
- Database queries should filter by user's accessible data
- WebSocket events should validate user authorization
- File uploads and exports require proper permission checks

## Performance Notes

- Database indexes are defined in Prisma schema
- Real-time updates use room-based broadcasting to reduce load
- Analytics queries use aggregation to minimize data transfer
- Components use React.lazy for code splitting where appropriate
- Images use Next.js Image optimization

## Common Debugging Commands

```bash
# Check database connection
npm run test-db

# View database schema
npm run prisma:studio

# Check TypeScript errors
npm run type-check

# View build output
npm run build

# Check environment variables
node -e "console.log(process.env)"
```

## Deployment Notes

- Build target: `standalone` for Docker deployment
- Database migrations: `npm run prisma:migrate:deploy`
- Environment validation occurs at startup
- Health check endpoint: `/api/health`
- Security headers configured in `next.config.mjs`
