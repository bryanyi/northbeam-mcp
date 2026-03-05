# Northbeam MCP

An MCP server that exposes [Northbeam](https://www.northbeam.io/) data to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/).

## Prerequisites

You'll need a Northbeam **Client ID** and **API Key**. Retrieve these from your Northbeam account settings before continuing.

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Run the setup script**

```bash
./start.sh
```

The script will:
- Prompt for your Client ID and API Key and write them to `.env`
- Print the MCP JSON configuration for use in any MCP-compatible client
- Offer to register the server with Claude Code automatically

## Manual configuration

If you prefer to configure manually, create a `.env` file:

```
NORTHBEAM_CLIENT_ID=your-client-id
NORTHBEAM_API_KEY=your-api-key
```

Then add the following to your MCP client's config, using the absolute path to this directory:

```json
{
  "mcpServers": {
    "northbeam-mcp": {
      "command": "/path/to/node_modules/.bin/tsx",
      "args": ["/path/to/northbeam-mcp/src/index.ts"],
      "env": {
        "NORTHBEAM_CLIENT_ID": "your-client-id",
        "NORTHBEAM_API_KEY": "your-api-key"
      }
    }
  }
}
```

Common config file locations:

| Client | Config path |
|---|---|
| Claude Code | Run `./start.sh` and choose yes, or copy the printed command |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.windsurf/mcp.json` |

## Available tools

### `get_orders`
Fetch orders within a date range.

| Parameter | Type | Description |
|---|---|---|
| `start_date` | `YYYY-MM-DD` | Start of the date range |
| `end_date` | `YYYY-MM-DD` | End of the date range |

### `list_spend`
List ad spend entries within a date range.

| Parameter | Type | Description |
|---|---|---|
| `start_date` | `YYYY-MM-DD` | Start of the date range |
| `end_date` | `YYYY-MM-DD` | End of the date range |
