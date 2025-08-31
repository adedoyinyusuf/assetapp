# Development Guide

This document provides comprehensive guidance for developers working on the NPC Asset Management System.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 15 or higher
- **Git**: For version control
- **VS Code** (recommended): With extensions for TypeScript, React, and Tailwind CSS

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assetapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Database setup**
   ```bash
   npm run db:setup
   npm run prisma:seed  # Optional: seed with sample data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Architecture

### Directory Structure

```
assetapp/
├── app/                    # Next.js 13+ app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard components
│   ├── assets/           # Asset management
│   ├── admin/            # Admin panel
│   └── layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix UI)
│   └── [feature]/        # Feature-specific components
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication logic
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── types/                # TypeScript type definitions
└── docs/                 # Documentation
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with JWT
- **Testing**: Jest, React Testing Library

## 🔐 Authentication & Authorization

### Role System

The application uses a hierarchical role-based access control system:

1. **VIEWER** - Basic read access
2. **OPERATOR** - Asset management operations
3. **MANAGER** - Enhanced management capabilities
4. **AUDITOR** - Full read access with audit capabilities
5. **ADMIN** - Full system access
6. **SUPER_ADMIN** - System owner

### Permission System

Permissions are granular and follow the pattern: `ACTION_RESOURCE`

- **Actions**: CREATE, READ, UPDATE, DELETE, AUDIT, MANAGE, EXPORT, IMPORT
- **Resources**: ASSET, USER, ROLE, REPORT, DASHBOARD, SETTINGS

### Usage Examples

```typescript
import { can, hasPermission } from '@/lib/auth/roles';

// Check if user can perform action
if (can(userRole, Action.CREATE, Resource.ASSET)) {
  // User can create assets
}

// Check specific permission
if (hasPermission(userRole, Resource.ASSET, Action.MANAGE)) {
  // User has full asset management permissions
}
```

## 🗄️ Database

### Prisma Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- **Users**: Authentication and role management
- **Assets**: Core asset information
- **Categories**: Asset categorization
- **States/LGAs**: Geographic location management
- **Asset Movements**: Asset transfer tracking
- **Depreciation**: Asset value calculations
- **Audit Logs**: System activity tracking

### Database Operations

```typescript
// Example: Creating an asset
const asset = await prisma.asset.create({
  data: {
    name: 'Laptop Computer',
    description: 'Dell XPS 13',
    purchaseValue: 500000,
    purchaseDate: new Date(),
    usefulLife: 5,
    salvageValue: 50000,
    currentValue: 500000,
    categoryId: 1,
    stateId: 1,
    lgaId: 1,
  },
  include: {
    category: true,
    state: true,
    lga: true,
  },
});
```

### Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations to production
npm run prisma:migrate:deploy

# Reset database (development only)
npm run db:reset
```

## 🧪 Testing

### Test Structure

```
__tests__/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
└── __mocks__/           # Mock files
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- AssetForm.test.tsx
```

### Test Examples

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetForm } from '@/components/AssetForm';

describe('AssetForm', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<AssetForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Asset Name'), {
      target: { value: 'Test Asset' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Test Asset',
      // ... other fields
    });
  });
});
```

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS for styling with custom configuration:

```typescript
// tailwind.config.ts
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### Component Styling

```typescript
// Example component with Tailwind classes
export function Button({ children, variant = 'primary', ...props }) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent',
  };
  
  return (
    <button
      className={cn(baseClasses, variantClasses[variant])}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 🔧 Development Workflow

### Code Quality

1. **ESLint**: Code linting and formatting
   ```bash
   npm run lint          # Check for issues
   npm run lint:fix      # Fix auto-fixable issues
   ```

2. **TypeScript**: Type checking
   ```bash
   npm run type-check    # Check types without emitting
   ```

3. **Prettier**: Code formatting
   ```bash
   npm run format        # Format all files
   npm run format:check  # Check formatting
   ```

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/asset-tracking
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add asset tracking functionality"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/asset-tracking
   # Create Pull Request on GitHub
   ```

### Commit Message Convention

Use conventional commits format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set:

```env
# Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### Build Process

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t assetapp .

# Run container
docker run -p 3000:3000 assetapp

# Or use docker-compose
docker-compose up -d
```

## 🐛 Debugging

### Development Tools

1. **React Developer Tools**: Browser extension for React debugging
2. **Prisma Studio**: Database management interface
   ```bash
   npm run prisma:studio
   ```
3. **Next.js DevTools**: Built-in development tools

### Common Issues

1. **Database Connection**: Check DATABASE_URL and PostgreSQL status
2. **Authentication**: Verify NEXTAUTH_SECRET and session configuration
3. **Build Errors**: Check TypeScript and ESLint configurations
4. **API Routes**: Verify route handlers and middleware

### Logging

```typescript
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { data, timestamp: new Date() });
}

// Production logging (implement with proper logging service)
logger.info('User action', { userId, action, timestamp });
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🤝 Contributing

1. Follow the established code style and patterns
2. Write tests for new functionality
3. Update documentation as needed
4. Use conventional commit messages
5. Create descriptive pull requests

## 📞 Support

For development questions or issues:

1. Check this documentation
2. Review existing issues
3. Contact the development team
4. Create a new issue with detailed information
