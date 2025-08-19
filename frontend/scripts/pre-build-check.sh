#!/bin/bash

# Pre-build check script to catch common errors before committing
# This should be run before commits to ensure code quality

set -e

echo "🔍 Running pre-build checks..."

# Check 1: TypeScript compilation
echo "✓ Checking TypeScript compilation..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

# Check 2: ESLint
echo "✓ Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint found issues"
  exit 1
fi

# Check 3: Prettier formatting
echo "✓ Checking code formatting..."
npm run format:check
if [ $? -ne 0 ]; then
  echo "❌ Code formatting issues found. Run 'npm run format' to fix."
  exit 1
fi

# Check 4: Test build (quick check without full build)
echo "✓ Testing Vite build configuration..."
npx vite build --mode development --logLevel silent --outDir temp-build-test && rm -rf temp-build-test
if [ $? -ne 0 ]; then
  echo "❌ Build configuration has errors"
  exit 1
fi

echo "✅ All pre-build checks passed!"