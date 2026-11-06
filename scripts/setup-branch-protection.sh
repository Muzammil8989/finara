#!/usr/bin/env bash
# Applies .github/rulesets/main-protection.json to the GitHub repo.
# Requires the GitHub CLI (https://cli.github.com) and `gh auth login` with admin rights.
set -euo pipefail

REPO="${1:-Muzammil8989/folio}"
RULESET_FILE="$(dirname "$0")/../.github/rulesets/main-protection.json"
RULESET_NAME="Protect main"

existing_id="$(gh api "repos/$REPO/rulesets" --jq ".[] | select(.name == \"$RULESET_NAME\") | .id")"

if [ -n "$existing_id" ]; then
  echo "Updating ruleset $existing_id on $REPO"
  gh api -X PUT "repos/$REPO/rulesets/$existing_id" --input "$RULESET_FILE" > /dev/null
else
  echo "Creating ruleset on $REPO"
  gh api -X POST "repos/$REPO/rulesets" --input "$RULESET_FILE" > /dev/null
fi

echo "Setting merge options: squash only, delete head branches"
gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true > /dev/null

echo "Done. main is protected."
