#!/bin/sh
set -e

echo "🧠 BrainBolt — Starting up..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if npx prisma db push --skip-generate 2>/dev/null; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ PostgreSQL failed to start after 30 attempts"
    exit 1
  fi
  echo "  Attempt $i/30 — waiting..."
  sleep 2
done

# Run migrations
echo "📦 Applying database schema..."
npx prisma db push --skip-generate

# Seed data
echo "🌱 Seeding database..."
npx prisma db seed 2>/dev/null || echo "  Seed already applied or skipped"

echo "🚀 Starting BrainBolt server..."
exec "$@"
