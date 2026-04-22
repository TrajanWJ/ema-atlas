#!/usr/bin/env bash
# skill-vault-sync.sh — Keep vault/Skills/ in sync with installed skills
set -euo pipefail

VAULT="$HOME/vault/Skills"
SKILLS_DIR="$HOME/skills"

mkdir -p "$VAULT"

installed=$(ls "$SKILLS_DIR" | grep -v ".git" | wc -l)
documented=$(find "$VAULT" -maxdepth 1 -name "*.md" -not -name "README.md" | wc -l)

echo "Skills: $installed installed, $documented documented"

for skill_dir in "$SKILLS_DIR"/*/; do
  name=$(basename "$skill_dir")
  [ "$name" = ".git" ] && continue
  note="$VAULT/$name.md"
  
  if [ ! -f "$note" ]; then
    desc=""
    if [ -f "$skill_dir/SKILL.md" ]; then
      desc=$(grep -m1 "^description:" "$skill_dir/SKILL.md" | sed 's/^description: *//' | tr -d '"' | head -c 200)
    fi
    
    echo "# $name" > "$note"
    echo "" >> "$note"
    echo "**Location:** ~/skills/$name" >> "$note"
    echo "**Description:** ${desc:-No description available}" >> "$note"
    echo "**Installed:** $(date -u +%Y-%m-%d)" >> "$note"
    echo "" >> "$note"
    echo "## Notes" >> "$note"
    echo "_Auto-created by skill-vault-sync. Review and enrich manually._" >> "$note"
    
    echo "  Created note for: $name"
  fi
done

echo "Sync complete"
