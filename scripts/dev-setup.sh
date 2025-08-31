#!/bin/bash

# NPC Asset Management System - Development Setup Script
echo "🚀 Setting up NPC Asset Management System for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL first."
    echo "   You can use: brew services start postgresql (macOS)"
    echo "   Or: sudo systemctl start postgresql (Linux)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run prisma:generate

# Setup database
echo "🗄️  Setting up database..."
npm run db:setup

# Seed database (optional)
read -p "🌱 Would you like to seed the database with sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run prisma:seed
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start development server:"
echo "   npm run dev"
echo ""
echo "🧪 To run tests:"
echo "   npm test"
echo ""
echo "📊 To open Prisma Studio:"
echo "   npm run prisma:studio"
echo ""
echo "🔧 To lint and fix code:"
echo "   npm run lint:fix"
