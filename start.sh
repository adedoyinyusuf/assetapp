#!/bin/sh
# Fail on any error
set -e

echo "Starting deployment script..."

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "Starting application server..."
exec node server.js
