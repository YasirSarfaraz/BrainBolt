#!/bin/sh
set -e

echo "🧠 BrainBolt — Starting up..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until node -e "require('net').createConnection({host:'postgres',port:5432}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" 2>/dev/null; do
  echo "  Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready"

echo "🚀 Starting BrainBolt server..."
exec "$@"
