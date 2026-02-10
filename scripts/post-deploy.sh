#!/bin/bash
# Railway Post-Deploy Hook
# This script runs after deployment to seed the auditor verifier user

echo "🌱 Running post-deploy seed..."

# Only run on production environment
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    echo "Running auditor verifier seed in production..."
    node scripts/add-auditor-verifier.js
    echo "✅ Post-deploy seed completed"
else
    echo "Skipping seed - not in production environment"
fi
