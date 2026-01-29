#!/bin/bash
# Fail on any error
set -e

echo "Starting deployment script..."

# Run database migrations
echo "Running database migrations..."
npx prisma db push --accept-data-loss

# Start the application server
echo "Starting application server..."

# Set Node.js memory limit to 1GB and start server
exec node --max-old-space-size=512 server.js

