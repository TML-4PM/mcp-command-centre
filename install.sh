#!/bin/bash
# T4H Claude Code completions installer
# Run: curl -fsSL https://raw.githubusercontent.com/TML-4PM/mcp-command-centre/main/install.sh | bash

set -e
REPO="TML-4PM/mcp-command-centre"
BASE="https://raw.githubusercontent.com/$REPO/main"
GREEN='\033[0;32m'; NC='\033[0m'
ok() { echo -e "${GREEN}✅ $1${NC}"; }

echo "=== T4H Claude Code Setup ==="

# 1. CLAUDE.md → already in repo root (Claude Code picks it up automatically per-project)
ok "CLAUDE.md already in repo (auto-loaded by Claude Code)"

# 2. Desktop config
DEST="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$DEST" ]; then
  cp "$DEST" "$DEST.backup.$(date +%s)"
  echo "Backed up existing desktop config"
fi
curl -fsSL "$BASE/claude_desktop_config.json" -o "$DEST"
ok "claude_desktop_config.json installed → $DEST"

# 3. MCP plugin
PLUGIN_DIR="$HOME/.claude/plugins/t4h-bridge"
mkdir -p "$PLUGIN_DIR"
curl -fsSL "$BASE/.claude/server.js" -o "$PLUGIN_DIR/server.js"
curl -fsSL "$BASE/.claude/plugin.json" -o "$PLUGIN_DIR/plugin.json"
cd "$PLUGIN_DIR"
npm init -y > /dev/null 2>&1
npm install @modelcontextprotocol/sdk > /dev/null 2>&1
ok "T4H bridge MCP plugin installed → $PLUGIN_DIR"

# 4. Boardroom slash command
COMMANDS_DIR="$HOME/.claude/commands"
mkdir -p "$COMMANDS_DIR"
if [ -f "$COMMANDS_DIR/boardroom.md" ]; then
  ok "boardroom.md already exists"
else
  curl -fsSL "$BASE/boardroom.md" -o "$COMMANDS_DIR/boardroom.md" 2>/dev/null || echo "⚠️  boardroom.md not in repo yet — copy manually"
fi

echo ""
echo "=== Done ==="
echo "Restart Claude Desktop to load new MCP servers."
echo "In Claude Code: CLAUDE.md loads automatically when you open any TML-4PM repo."
echo ""
echo "Test bridge: curl -s -X POST https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke -H 'x-api-key: bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4' -H 'Content-Type: application/json' -d '{\"fn\":\"troy-sql-executor\",\"sql\":\"SELECT 1\"}'"
