#!/usr/bin/env bash
# start.sh — Diagnostic startup wrapper for GMS Node.js server.
#
# Replaces `npx tsx server.mjs` as the Railway start command so that:
#   1. tsx is resolved from node_modules/.bin (no npx download race)
#   2. Every byte of stdout/stderr is captured and forwarded
#   3. The process exit code is always printed before the container dies,
#      giving Railway's log collector something to show even on silent crashes
#
# Usage (railway.toml):  startCommand = "bash start.sh"

set -euo pipefail

TSX_BIN="./node_modules/.bin/tsx"

echo "[start.sh] ── GMS startup wrapper ──────────────────────────────" >&2
echo "[start.sh] Node version : $(node --version)" >&2
echo "[start.sh] npm  version : $(npm --version)" >&2
echo "[start.sh] Working dir  : $(pwd)" >&2
echo "[start.sh] DATA_DIR     : ${DATA_DIR:-<not set>}" >&2
echo "[start.sh] PORT         : ${PORT:-<not set>}" >&2

# Verify tsx binary exists (catches missing node_modules)
if [ ! -f "$TSX_BIN" ]; then
  echo "[start.sh] FATAL: tsx binary not found at $TSX_BIN" >&2
  echo "[start.sh] Contents of node_modules/.bin (first 20):" >&2
  ls node_modules/.bin 2>/dev/null | head -20 >&2 || echo "[start.sh] node_modules/.bin does not exist" >&2
  exit 1
fi

echo "[start.sh] tsx binary   : $TSX_BIN ($(ls -lh "$TSX_BIN" | awk '{print $5}'))" >&2
echo "[start.sh] Launching server.mjs via tsx…" >&2

# Run tsx and capture its exit code without letting set -e kill us first
set +e
"$TSX_BIN" server.mjs 2>&1
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
  echo "" >&2
  echo "[start.sh] !! tsx exited with code $EXIT_CODE !!" >&2
  echo "[start.sh] Check the output above for the root cause." >&2
fi

echo "[start.sh] Process exited — code $EXIT_CODE" >&2
exit $EXIT_CODE
