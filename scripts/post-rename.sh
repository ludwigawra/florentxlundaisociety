#!/usr/bin/env bash
# post-rename.sh — run after renaming the repo on GitHub from
# `florentxlundaisociety` to `aios`.
#
# What this does:
#   1. Updates the git remote URL so `git push` keeps working.
#   2. Replaces every hardcoded reference to the old repo name in 4 files.
#   3. Stages the changes and shows you the diff so you can commit.
#
# Run from the repo root.

set -e

OLD_NAME="florentxlundaisociety"
NEW_NAME="aios"
OWNER="ludwigawra"

echo "=== 1. Updating git remote ==="
git remote set-url origin "git@github.com:${OWNER}/${NEW_NAME}.git"
git remote -v

echo ""
echo "=== 2. Replacing references in source files ==="

FILES=(
  "README.md"
  "docs/getting-started.md"
  "plugin/.claude-plugin/plugin.json"
  ".claude-plugin/marketplace.json"
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    # macOS sed needs the empty extension arg on -i.
    sed -i '' "s|${OWNER}/${OLD_NAME}|${OWNER}/${NEW_NAME}|g" "$f"
    echo "  updated $f"
  else
    echo "  skipped $f (not found)"
  fi
done

echo ""
echo "=== 3. Staged changes ==="
git add "${FILES[@]}"
git status --short

echo ""
echo "Done. Review with 'git diff --cached', then commit:"
echo "  git commit -m \"Rename repo: florentxlundaisociety -> aios\""
echo "  git push"
