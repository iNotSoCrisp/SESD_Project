#!/usr/bin/env bash
set -e
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss
echo "Starting server..."
exec node dist/app.js
