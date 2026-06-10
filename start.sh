#!/bin/bash
# start.sh — Start SPMS AI Pipeline server
# Usage: bash start.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$SCRIPT_DIR/pipeline"
VENV="$PIPELINE_DIR/venv"
ENV_FILE="$SCRIPT_DIR/.env"

echo "========================================"
echo "  SPMS AI PIPELINE — Starting Server"
echo "========================================"

# Kill any existing server on port 8000
echo "Stopping any running pipeline server..."
lsof -ti :8000 | xargs kill -9 2>/dev/null
sleep 2

# Reset state to idle
cat > "$PIPELINE_DIR/results.json" << 'JSON'
{"status":"idle","last_run":null,"tickets_processed":0,"deployment_url":"","error":""}
JSON
echo "State reset to idle."

# Load environment variables
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found at $ENV_FILE"
    exit 1
fi
set -a && source "$ENV_FILE" && set +a

# Start server using venv Python
cd "$PIPELINE_DIR"
nohup "$VENV/bin/python3" main.py > /tmp/pipeline.log 2>&1 &
PID=$!
echo "Pipeline PID: $PID"

# Wait and verify
sleep 5
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo ""
    echo "✅ Pipeline running at http://localhost:8000"
    echo "   $(curl -s http://localhost:8000/health)"
    echo ""
    echo "Endpoints:"
    echo "  POST /run-pipeline  — trigger pipeline"
    echo "  GET  /status        — live logs + status"
    echo "  GET  /health        — server + jira health"
    echo "  GET  /tickets       — To Do tickets"
    echo "  POST /reset-stuck   — reset stuck In Progress tickets"
    echo ""
    echo "Logs: tail -f /tmp/pipeline.log"
else
    echo "❌ Pipeline failed to start. Check logs:"
    echo "   tail -20 /tmp/pipeline.log"
    exit 1
fi
