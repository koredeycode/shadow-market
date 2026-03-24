#!/bin/bash

# Security audit script for ShadowMarket
# Checks for vulnerabilities in dependencies, code quality, and security best practices

set -e

echo "🔒 ShadowMarket Security Audit"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to print results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
  WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
}

# 1. Dependency vulnerability scan
echo "1️⃣  Checking dependencies for known vulnerabilities..."
echo "---------------------------------------------------"

# Frontend dependencies
cd frontend
echo "📦 Scanning frontend dependencies..."
if pnpm audit --audit-level=high --json > /tmp/frontend-audit.json 2>/dev/null; then
  print_result 0 "Frontend dependencies: No high/critical vulnerabilities"
else
  VULNERABILITIES=$(cat /tmp/frontend-audit.json | grep -o '"severity":"high"' | wc -l)
  if [ $VULNERABILITIES -gt 0 ]; then
    print_result 1 "Frontend dependencies: $VULNERABILITIES high/critical vulnerabilities found"
    echo "Run 'cd frontend && pnpm audit' for details"
  else
    print_result 0 "Frontend dependencies: No high/critical vulnerabilities"
  fi
fi
cd ..

# Backend dependencies
cd backend
echo "📦 Scanning backend dependencies..."
if pnpm audit --audit-level=high --json > /tmp/backend-audit.json 2>/dev/null; then
  print_result 0 "Backend dependencies: No high/critical vulnerabilities"
else
  VULNERABILITIES=$(cat /tmp/backend-audit.json | grep -o '"severity":"high"' | wc -l)
  if [ $VULNERABILITIES -gt 0 ]; then
    print_result 1 "Backend dependencies: $VULNERABILITIES high/critical vulnerabilities found"
    echo "Run 'cd backend && pnpm audit' for details"
  else
    print_result 0 "Backend dependencies: No high/critical vulnerabilities"
  fi
fi
cd ..

echo ""

# 2. Code quality checks
echo "2️⃣  Checking code quality and security patterns..."
echo "----------------------------------------------"

# Check for hardcoded secrets
echo "🔍 Scanning for hardcoded secrets..."
SECRETS=$(grep -r -i -E "(password|secret|api_key|private_key|token)\s*=\s*['\"][^'\"]+['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
  . | grep -v ".example" | grep -v "test" | wc -l)

if [ $SECRETS -eq 0 ]; then
  print_result 0 "No hardcoded secrets found"
else
  print_warning "$SECRETS potential hardcoded secrets found"
  echo "Review matches with: grep -r -i -E \"(password|secret|api_key)\" --include=\"*.ts\" ."
fi

# Check for console.log in production code (excluding test files)
echo "🔍 Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.(log|debug|info)" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=__tests__ --exclude-dir=e2e \
  frontend/src backend/src 2>/dev/null | wc -l)

if [ $CONSOLE_LOGS -eq 0 ]; then
  print_result 0 "No console.log statements in production code"
else
  print_warning "$CONSOLE_LOGS console.log statements found (should be removed in production)"
fi

# Check for eval() usage
echo "🔍 Checking for eval() usage..."
EVAL_USAGE=$(grep -r "eval(" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=dist \
  . 2>/dev/null | wc -l)

if [ $EVAL_USAGE -eq 0 ]; then
  print_result 0 "No eval() usage found"
else
  print_result 1 "$EVAL_USAGE eval() usages found (security risk)"
fi

# Check for dangerouslySetInnerHTML
echo "🔍 Checking for dangerouslySetInnerHTML..."
DANGEROUS_HTML=$(grep -r "dangerouslySetInnerHTML" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  frontend/src 2>/dev/null | wc -l)

if [ $DANGEROUS_HTML -eq 0 ]; then
  print_result 0 "No dangerouslySetInnerHTML usage found"
else
  print_warning "$DANGEROUS_HTML dangerouslySetInnerHTML usages found (XSS risk)"
fi

echo ""

# 3. Environment security
echo "3️⃣  Checking environment configuration..."
echo "--------------------------------------"

# Check for .env files in git
echo "🔍 Checking for .env files in version control..."
if git ls-files | grep -q "\.env$"; then
  print_result 1 ".env file found in git (security risk)"
else
  print_result 0 "No .env files in version control"
fi

# Check .gitignore
echo "🔍 Checking .gitignore..."
if [ -f .gitignore ]; then
  if grep -q "\.env" .gitignore; then
    print_result 0 ".gitignore includes .env"
  else
    print_result 1 ".gitignore missing .env"
  fi
  
  if grep -q "node_modules" .gitignore; then
    print_result 0 ".gitignore includes node_modules"
  else
    print_result 1 ".gitignore missing node_modules"
  fi
else
  print_result 1 ".gitignore file not found"
fi

echo ""

# 4. TypeScript security
echo "4️⃣  Checking TypeScript configuration..."
echo "------------------------------------"

# Check for strict mode
echo "🔍 Checking TypeScript strict mode..."
for tsconfig in $(find . -name "tsconfig.json" -not -path "*/node_modules/*"); do
  if grep -q '"strict"[[:space:]]*:[[:space:]]*true' $tsconfig; then
    print_result 0 "$(dirname $tsconfig): strict mode enabled"
  else
    print_warning "$(dirname $tsconfig): strict mode not enabled"
  fi
done

echo ""

# 5. Docker security
echo "5️⃣  Checking Docker configuration..."
echo "--------------------------------"

if [ -f docker-compose.yml ]; then
  # Check for exposed ports
  echo "🔍 Checking for unnecessarily exposed ports..."
  EXPOSED_PORTS=$(grep -E "^\s+- \"[0-9]+:[0-9]+\"" docker-compose.yml | wc -l)
  if [ $EXPOSED_PORTS -gt 5 ]; then
    print_warning "$EXPOSED_PORTS ports exposed (review if all are necessary)"
  else
    print_result 0 "Reasonable number of exposed ports"
  fi
  
  # Check for root user
  echo "🔍 Checking for root user in containers..."
  if grep -q "user: root" docker-compose.yml; then
    print_warning "Containers running as root user found"
  else
    print_result 0 "No explicit root user found"
  fi
fi

echo ""

# 6. Summary
echo "📊 Security Audit Summary"
echo "======================="
echo ""

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No issues found!${NC}"
  exit 0
elif [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${YELLOW}⚠ $WARNINGS_FOUND warnings found${NC}"
  echo "Review warnings and address if necessary"
  exit 0
else
  echo -e "${RED}✗ $ISSUES_FOUND critical issues found${NC}"
  echo -e "${YELLOW}⚠ $WARNINGS_FOUND warnings found${NC}"
  echo ""
  echo "Please address critical issues before deployment!"
  exit 1
fi
