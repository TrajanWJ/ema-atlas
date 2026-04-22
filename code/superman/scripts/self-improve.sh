#!/bin/bash
# Self-Improvement Loop for Code Intelligence Engine
# Runs the engine against its own codebase repeatedly to improve itself
# Usage: bash scripts/self-improve.sh

set -e

PROJECT_DIR="C:/Users/pourb/OneDrive/Desktop/superman-ide"
PORT=3005
SERVER_URL="http://localhost:$PORT"
LOG_FILE="$PROJECT_DIR/self-improve.log"
MAX_CYCLES=50  # Safety cap
CYCLE_PAUSE=30  # seconds between cycles

cd "$PROJECT_DIR"

echo "=== Self-Improvement Loop ===" | tee "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "Target: $PROJECT_DIR" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Function to check if server is running
check_server() {
  curl -s "$SERVER_URL/" > /dev/null 2>&1
}

# Function to start server if not running
ensure_server() {
  if ! check_server; then
    echo "[$(date +%H:%M:%S)] Starting server..." | tee -a "$LOG_FILE"
    node dist/server.js &
    SERVER_PID=$!
    echo "[$(date +%H:%M:%S)] Server PID: $SERVER_PID" | tee -a "$LOG_FILE"

    # Wait for server to be ready
    for i in $(seq 1 30); do
      if check_server; then
        echo "[$(date +%H:%M:%S)] Server ready" | tee -a "$LOG_FILE"
        return 0
      fi
      sleep 1
    done
    echo "[$(date +%H:%M:%S)] ERROR: Server failed to start" | tee -a "$LOG_FILE"
    return 1
  fi
  echo "[$(date +%H:%M:%S)] Server already running" | tee -a "$LOG_FILE"
}

# Function to run one autonomous cycle
run_cycle() {
  local cycle=$1
  echo "" | tee -a "$LOG_FILE"
  echo "=====================================" | tee -a "$LOG_FILE"
  echo "CYCLE $cycle / $MAX_CYCLES" | tee -a "$LOG_FILE"
  echo "Time: $(date)" | tee -a "$LOG_FILE"
  echo "=====================================" | tee -a "$LOG_FILE"

  # Step 1: Get suggestions
  echo "[$(date +%H:%M:%S)] Fetching suggestions..." | tee -a "$LOG_FILE"
  SUGGESTIONS=$(curl -s "$SERVER_URL/suggestions?repoPath=$PROJECT_DIR" 2>&1)
  SUGGESTION_COUNT=$(echo "$SUGGESTIONS" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);console.log(j.suggestions?j.suggestions.length:0)}
      catch(e){console.log(0)}
    })
  " 2>/dev/null || echo "0")
  echo "[$(date +%H:%M:%S)] Found $SUGGESTION_COUNT suggestions" | tee -a "$LOG_FILE"

  if [ "$SUGGESTION_COUNT" = "0" ]; then
    echo "[$(date +%H:%M:%S)] No suggestions — running autonomous analysis..." | tee -a "$LOG_FILE"

    # Run full autonomous cycle
    RESULT=$(curl -s -X POST "$SERVER_URL/autonomous" \
      -H "Content-Type: application/json" \
      -d "{\"repoPath\": \"$PROJECT_DIR\"}" \
      --max-time 600 2>&1)

    echo "[$(date +%H:%M:%S)] Autonomous result:" | tee -a "$LOG_FILE"
    echo "$RESULT" | head -c 2000 | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
  else
    # Step 2: For each suggestion, get build instruction and execute
    echo "$SUGGESTIONS" | node -e "
      let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
        try{
          const j=JSON.parse(d);
          const suggestions = j.suggestions || [];
          // Take top 3 by priority
          const top = suggestions.slice(0, 3);
          top.forEach((s,i) => {
            console.log(JSON.stringify({index:i, id:s.id, title:s.title, type:s.type, severity:s.severity}));
          });
        }catch(e){console.error(e.message)}
      })
    " 2>/dev/null | while read -r line; do
      SUGG_ID=$(echo "$line" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))" 2>/dev/null)
      SUGG_TITLE=$(echo "$line" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).title))" 2>/dev/null)

      echo "[$(date +%H:%M:%S)] Building suggestion: $SUGG_TITLE" | tee -a "$LOG_FILE"

      # Get build instruction
      BUILD_INSTRUCTION=$(curl -s -X POST "$SERVER_URL/suggestions/$SUGG_ID/build-instruction?repoPath=$PROJECT_DIR" \
        -H "Content-Type: application/json" \
        --max-time 120 2>&1)

      INSTRUCTION=$(echo "$BUILD_INSTRUCTION" | node -e "
        let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
          try{console.log(JSON.parse(d).instruction||'')}catch(e){console.log('')}
        })
      " 2>/dev/null)

      if [ -n "$INSTRUCTION" ]; then
        echo "[$(date +%H:%M:%S)] Applying changes..." | tee -a "$LOG_FILE"

        # Apply changes via the engine
        APPLY_RESULT=$(curl -s -X POST "$SERVER_URL/apply-changes" \
          -H "Content-Type: application/json" \
          -d "{\"repoPath\": \"$PROJECT_DIR\", \"instruction\": $(echo "$INSTRUCTION" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.stringify(d)))")}" \
          --max-time 300 2>&1)

        SUCCESS=$(echo "$APPLY_RESULT" | node -e "
          let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
            try{console.log(JSON.parse(d).success?'true':'false')}catch(e){console.log('false')}
          })
        " 2>/dev/null)

        echo "[$(date +%H:%M:%S)] Apply result: success=$SUCCESS" | tee -a "$LOG_FILE"

        # Send feedback
        curl -s -X POST "$SERVER_URL/suggestions/$SUGG_ID/feedback" \
          -H "Content-Type: application/json" \
          -d "{\"repoPath\": \"$PROJECT_DIR\", \"outcome\": \"$SUCCESS\", \"buildPassed\": $SUCCESS}" \
          --max-time 30 > /dev/null 2>&1

        echo "[$(date +%H:%M:%S)] Feedback recorded" | tee -a "$LOG_FILE"
      else
        echo "[$(date +%H:%M:%S)] No instruction generated, skipping" | tee -a "$LOG_FILE"
      fi
    done
  fi

  # Step 3: Rebuild after changes
  echo "[$(date +%H:%M:%S)] Rebuilding backend..." | tee -a "$LOG_FILE"
  npx tsc -p tsconfig.server.json 2>&1 | tee -a "$LOG_FILE"

  # Step 4: Run tests
  echo "[$(date +%H:%M:%S)] Running tests..." | tee -a "$LOG_FILE"
  npx vitest run 2>&1 | tail -5 | tee -a "$LOG_FILE"

  # Step 5: Commit if tests pass
  TEST_EXIT=$?
  if [ $TEST_EXIT -eq 0 ]; then
    CHANGED=$(git status --porcelain | wc -l)
    if [ "$CHANGED" -gt 0 ]; then
      echo "[$(date +%H:%M:%S)] Committing improvements..." | tee -a "$LOG_FILE"
      git add -A
      git commit -m "Self-improvement cycle $cycle: autonomous enhancement

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>" 2>&1 | tee -a "$LOG_FILE"
    else
      echo "[$(date +%H:%M:%S)] No changes to commit" | tee -a "$LOG_FILE"
    fi
  else
    echo "[$(date +%H:%M:%S)] Tests failed — reverting changes" | tee -a "$LOG_FILE"
    git checkout -- . 2>&1
  fi

  echo "[$(date +%H:%M:%S)] Cycle $cycle complete" | tee -a "$LOG_FILE"
}

# Main loop
ensure_server || exit 1

for cycle in $(seq 1 $MAX_CYCLES); do
  run_cycle $cycle

  echo "[$(date +%H:%M:%S)] Pausing $CYCLE_PAUSE seconds before next cycle..." | tee -a "$LOG_FILE"
  sleep $CYCLE_PAUSE
done

echo "" | tee -a "$LOG_FILE"
echo "=== Self-Improvement Complete ===" | tee -a "$LOG_FILE"
echo "Finished: $(date)" | tee -a "$LOG_FILE"
