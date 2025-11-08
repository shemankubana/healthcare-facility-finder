#!/bin/bash
# Script to remove node_modules from git tracking
# This fixes the issue where node_modules was accidentally committed in d611a03

set -e  # Exit on error

echo "=================================="
echo "Cleaning up node_modules from git"
echo "=================================="

# Check if node_modules is tracked in git
if git ls-files | grep -q "node_modules"; then
    echo "✓ Found node_modules files in git"

    # Count how many files
    COUNT=$(git ls-files | grep "node_modules" | wc -l)
    echo "  Files to remove: $COUNT"

    # Remove from git tracking (but keep local files)
    echo ""
    echo "Removing node_modules from git tracking..."
    git rm -r --cached backend/node_modules 2>/dev/null || echo "  (backend/node_modules already removed or doesn't exist)"
    git rm -r --cached frontend-react/frontend/node_modules 2>/dev/null || echo "  (frontend node_modules already removed or doesn't exist)"
    git rm -r --cached node_modules 2>/dev/null || echo "  (root node_modules already removed or doesn't exist)"

    echo ""
    echo "✓ node_modules removed from git tracking"
    echo "  (Local files preserved - they are now properly ignored)"

    # Show what changed
    echo ""
    echo "Git status after cleanup:"
    git status --short | head -20

    echo ""
    echo "=================================="
    echo "Next steps:"
    echo "1. Review the changes above"
    echo "2. Commit with: git commit -m 'Remove node_modules from git tracking'"
    echo "3. Push to your branch"
    echo "=================================="
else
    echo "✓ No node_modules files found in git tracking"
    echo "  Nothing to clean up!"
fi

echo ""
echo "Note: Make sure .gitignore includes 'node_modules/' to prevent this in the future"
