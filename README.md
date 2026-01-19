# NPC Asset Management System 🚀

A comprehensive, enterprise-grade asset management solution for the National Population Commission, built with modern web technologies and enhanced with real-time capabilities, advanced analytics, and AI-powered features.

## ✨ Enhanced Features

### 🔄 Real-Time Updates & WebSocket Integration
- **Live Dashboard Updates**: Real-time asset changes, user activities, and system notifications
- **WebSocket Server**: Dedicated server for instant communication and updates
- **Room-based Broadcasting**: Targeted updates for different user groups and departments
- **Connection Status Monitoring**: Real-time connection health and status indicators

### 📊 Advanced Analytics & Business Intelligence
- **Comprehensive Metrics**: Asset distribution, financial analysis, operational insights
- **Interactive Charts**: Beautiful visualizations using Recharts library
- **Trend Analysis**: Historical data analysis and pattern recognition
- **Predictive Insights**: Maintenance predictions, replacement recommendations, risk assessment
- **Export Capabilities**: CSV, JSON, and PDF export for all analytics data

### 🔍 AI-Powered Advanced Search
- **Intelligent Suggestions**: Real-time search suggestions with relevance scoring
- **Advanced Filtering**: Multi-dimensional filtering by category, location, value, and date
- **AI Relevance Scoring**: Smart ranking based on multiple factors
- **Trending Searches**: Popular search terms and trending assets
- **Related Assets**: AI-powered asset recommendations

### 🎯 Enhanced Dashboard Experience
- **Multi-Tab Interface**: Overview, Analytics, Search, and Settings tabs
- **Real-Time Metrics**: Live counters and status indicators
- **Quick Actions**: One-click access to common operations
- **System Status**: Real-time system health monitoring
- **Responsive Design**: Optimized for all device sizes

### 🛡️ Enhanced Security & Performance
- **Role-Based Access Control**: Granular permissions with role hierarchy
- **Real-Time Authentication**: Secure session management with NextAuth.js
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Error Boundaries**: Graceful error handling and recovery
- **Performance Optimization**: Lazy loading, code splitting, and caching

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14**: App Router with server-side rendering
- **React 18**: Latest React features and hooks
- **TypeScript**: Full type safety and IntelliSense
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Recharts**: Beautiful and responsive charts

### **Backend & Database**
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Redis**: Caching and session storage

### **Real-Time & Communication**
- **Socket.IO**: WebSocket implementation for real-time updates
- **WebSocket Server**: Dedicated real-time communication server
- **Room Management**: Organized real-time updates by user groups

### **Authentication & Security**
- **NextAuth.js**: Complete authentication solution
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Granular permission system
- **CORS Protection**: Secure cross-origin requests

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 15 or higher
- **Redis**: Version 7 or higher (optional but recommended)
- **Docker**: For containerized services

### 1. Clone and Setup
```bash
git clone <repository-url>
cd assetapp
cp env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
npm run db:setup
npm run prisma:seed  # Optional: seed with sample data
```

### 4. Start Enhanced Development Environment
```bash
# Windows
scripts/start-enhanced.bat

# Linux/macOS
scripts/dev-setup.sh
```

### 5. Access the Application
- **Main App**: http://localhost:3000
- **WebSocket Server**: ws://localhost:3001
- **Prisma Studio**: http://localhost:5555 (if enabled)

## 📁 Project Structure

```
assetapp/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── assets/           # Asset management
│   ├── admin/            # Admin panel
│   └── operations/       # Asset operations
├── components/            # Reusable components
│   ├── ui/               # UI component library
│   ├── AdvancedAnalytics.tsx
│   ├── AdvancedSearch.tsx
│   └── LoadingSpinner.tsx
├── lib/                   # Utility libraries
│   ├── analytics.ts      # Analytics service
│   ├── search.ts         # Search service
│   ├── websocket.ts      # WebSocket client
│   └── prisma.ts         # Database client
├── server/                # WebSocket server
│   └── websocket-server.js
├── prisma/                # Database schema and migrations
├── scripts/               # Development and deployment scripts
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables
The system uses comprehensive environment configuration:

```bash
# Core Configuration
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="..."

# Real-Time Features
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
ENABLE_WEBSOCKET="true"
ENABLE_REAL_TIME_UPDATES="true"

# Advanced Features
ENABLE_ADVANCED_ANALYTICS="true"
ENABLE_AI_SEARCH="true"
ENABLE_NOTIFICATIONS="true"

# Security & Performance
RATE_LIMIT_MAX_REQUESTS="100"
ENABLE_REQUEST_LOGGING="true"
```

### Feature Flags
Control feature availability with environment variables:
- `ENABLE_WEBSOCKET`: Enable/disable real-time updates
- `ENABLE_ADVANCED_ANALYTICS`: Enable/disable analytics dashboard
- `ENABLE_AI_SEARCH`: Enable/disable AI-powered search
- `ENABLE_NOTIFICATIONS`: Enable/disable browser notifications

## 📊 Analytics & Reporting

### Available Metrics
- **Asset Metrics**: Distribution, utilization, age analysis
- **Financial Metrics**: Value tracking, depreciation analysis
- **Operational Metrics**: Movement tracking, availability
- **Trend Analysis**: Historical patterns and growth
- **Predictive Insights**: Maintenance and replacement planning

### Export Formats
- **CSV**: For spreadsheet analysis
- **JSON**: For API integration
- **PDF**: For official reports

## 🔍 Advanced Search

### Search Capabilities
- **Full-Text Search**: Across asset names and descriptions
- **Smart Filtering**: By category, location, value, and date
- **AI Relevance**: Intelligent result ranking
- **Real-Time Suggestions**: As-you-type search suggestions
- **Trending Searches**: Popular and recent search terms

### Search Filters
- Category-based filtering
- Geographic filtering (State/LGA)
- Value range filtering
- Date range filtering
- Status-based filtering

## 🌐 Real-Time Features

### WebSocket Events
- **Asset Updates**: Create, update, delete operations
- **User Activity**: Login, logout, action tracking
- **System Notifications**: System status and alerts
- **Depreciation Updates**: Financial calculation updates

### Real-Time Dashboard
- Live metrics updates
- Instant notification delivery
- Connection status monitoring
- Real-time activity feed

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Production build
docker build -t assetapp .
docker run -p 3000:3000 assetapp
```

### Environment-Specific Configs
- **Development**: Local database, debug mode enabled
- **Staging**: Staging database, limited features
- **Production**: Production database, all features enabled

## 📈 Performance & Monitoring

### Performance Features
- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Component and page lazy loading
- **Caching**: Redis-based caching for frequently accessed data
- **Optimization**: Image optimization and compression

### Monitoring
- **Health Checks**: `/api/health` endpoint for monitoring
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Metrics**: Real-time performance monitoring
- **User Analytics**: Usage patterns and feature adoption

## 🔒 Security Features

### Authentication & Authorization
- **Multi-Factor Authentication**: Enhanced security options
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure JWT-based sessions
- **API Security**: Rate limiting and CORS protection

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Prisma ORM protection
- **XSS Prevention**: React-based XSS protection
- **CSRF Protection**: Built-in CSRF protection

## 🧪 Testing

### Test Coverage
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing

## 📚 Documentation

### Available Documentation
- **Quick Start Guide**: `docs/QUICK_START_GUIDE.md`
- **Development Guide**: `docs/DEVELOPMENT.md`
- **Stock Verification**: `docs/STOCK_VERIFICATION_QUICKSTART.md`
- **Material 3 Design**: `docs/MATERIAL3_QUICKSTART.md`
- **Warp Terminal**: `docs/WARP.md`
- **API Documentation**: Comprehensive API reference
- **User Manual**: End-user documentation
- **Admin Guide**: Administrative functions guide

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 📞 Support

### Getting Help
- **Documentation**: Check the docs folder
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact the development team

### System Requirements
- **Node.js**: 18.x or higher
- **PostgreSQL**: 15.x or higher
- **Redis**: 7.x or higher (recommended)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB available space

## 🎯 Roadmap

### Upcoming Features
- **Mobile App**: React Native mobile application
- **Advanced Reporting**: Custom report builder
- **Integration APIs**: Third-party system integration
- **Machine Learning**: Enhanced AI-powered insights
- **Multi-Tenancy**: Support for multiple organizations

### Version History
- **v2.0.0**: Enhanced real-time features and analytics
- **v1.0.0**: Core asset management functionality
- **v0.9.0**: Beta release with basic features

---

**Built with ❤️ for the National Population Commission**

*This system represents the cutting edge of asset management technology, providing government agencies with enterprise-grade tools for efficient resource management.*
