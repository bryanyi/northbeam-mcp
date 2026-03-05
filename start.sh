#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "Northbeam MCP Setup"
echo "-------------------"

# Prompt for credentials
echo "(CMD+C or CTRL+C to cancel any time)"
echo
read -p "Northbeam Client ID: " client_id
echo "(CMD+C or CTRL+C to cancel any time)"
read -s -p "Northbeam API Key (will not show on purpose): " api_key
echo

if [[ -z "$client_id" || -z "$api_key" ]]; then
  echo "Error: both values are required." >&2
  exit 1
fi

# Write .env
cat > "$ENV_FILE" <<EOF
NORTHBEAM_CLIENT_ID=$client_id
NORTHBEAM_API_KEY=$api_key
EOF

echo ".env created at $ENV_FILE"

# Detect tsx
TSX_PATH="$(command -v tsx 2>/dev/null || echo "")"
if [[ -z "$TSX_PATH" ]]; then
  TSX_PATH="$SCRIPT_DIR/node_modules/.bin/tsx"
fi

if [[ ! -x "$TSX_PATH" ]]; then
  echo "tsx not found. Run 'npm install' first." >&2
  exit 1
fi

echo
echo "MCP JSON configuration (for Cursor, Windsurf, or other MCP clients):"
echo
cat <<EOF
{
  "mcpServers": {
    "northbeam-mcp": {
      "command": "$TSX_PATH",
      "args": ["$SCRIPT_DIR/src/index.ts"],
      "env": {
        "NORTHBEAM_CLIENT_ID": "$client_id",
        "NORTHBEAM_API_KEY": "$api_key"
      }
    }
  }
}
EOF

echo
echo "Claude Code: run the following command to register the MCP:"
echo
echo "  claude mcp add northbeam-mcp -e NORTHBEAM_CLIENT_ID=\"$client_id\" -e NORTHBEAM_API_KEY=\"$api_key\" -- \"$TSX_PATH\" \"$SCRIPT_DIR/src/index.ts\""
echo
echo "(CMD+C or CTRL+C to cancel any time)"
read -p "Run the Claude Code command now? [y/N] " run_now
if [[ "$run_now" =~ ^[Yy]$ ]]; then
  claude mcp remove northbeam-mcp 2>/dev/null || true
  claude mcp add northbeam-mcp -e "NORTHBEAM_CLIENT_ID=$client_id" -e "NORTHBEAM_API_KEY=$api_key" -- "$TSX_PATH" "$SCRIPT_DIR/src/index.ts"
  echo "Done. Restart Claude Code to load the MCP."
fi
