#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "Northbeam MCP Setup"
echo "-------------------"

# Load existing .env values if present
existing_client_id=""
existing_api_key=""
if [[ -f "$ENV_FILE" ]]; then
  existing_client_id="$(grep -E '^NORTHBEAM_CLIENT_ID=' "$ENV_FILE" | cut -d= -f2-)"
  existing_api_key="$(grep -E '^NORTHBEAM_API_KEY=' "$ENV_FILE" | cut -d= -f2-)"
fi

if [[ -n "$existing_client_id" && -n "$existing_api_key" ]]; then
  echo "Found existing credentials in .env:"
  echo "  Client ID: $existing_client_id"
  echo "  API Key:   (set)"
  echo
  read -p "Use existing credentials? [Y/n] " use_existing
  if [[ ! "$use_existing" =~ ^[Nn]$ ]]; then
    client_id="$existing_client_id"
    api_key="$existing_api_key"
    echo "Using existing credentials."
  fi
fi

if [[ -z "$client_id" || -z "$api_key" ]]; then
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
fi

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
