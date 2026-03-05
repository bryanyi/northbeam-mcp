# Northbeam MCP

An MCP server that exposes [Northbeam](https://www.northbeam.io/) data to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/). It uses Northbeam's [Data Export API](https://docs.northbeam.io/data-export-api).

## Prerequisites

You'll need a Northbeam **Client ID** and **API Key**. Retrieve these from your Northbeam account settings before continuing.

## Setup

**1. Clone this repository**

You'll need Git installed to download this project. If you don't have it, get it at [git-scm.com/downloads](https://git-scm.com/downloads) and follow the installer for your operating system.

Once Git is installed, download the project files to your computer by running:

```bash
git clone https://github.com/bryanyi/northbeam-mcp.git
```

This will create a folder called `northbeam-mcp` in whatever directory your terminal is currently in. If you're unsure where that is, it's usually your home folder (e.g. `/Users/yourname` on Mac). You can choose a different location by navigating to it first — for example, to put it on your Desktop:

```bash
cd ~/Desktop
git clone https://github.com/bryanyi/northbeam-mcp.git
```

Once cloned, move into the folder:

```bash
cd northbeam-mcp
```

**2. Install dependencies**

```bash
npm install
```

**3. Run the setup script**

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

## Updating

If you previously cloned this repository, pull the latest changes and restart your MCP client:

```bash
cd northbeam-mcp
git pull
```

No reinstall or build step needed.

## Available tools

### `get_orders`
Fetch orders within a date range.

| Parameter | Type | Description |
|---|---|---|
| `start_date` | `YYYY-MM-DD` | Start of the date range |
| `end_date` | `YYYY-MM-DD` | End of the date range |

### `get_marketing_performance`
Fetch attributed marketing performance data (spend, revenue, CAC, AOV, ROAS, etc.) broken down by platform, campaign, adset, or ad. The assistant will call this automatically when asked about marketing performance or ad spend.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `metrics` | `string[]` | — | Metric IDs to include, e.g. `["spend", "rev", "cac"]` |
| `level` | `platform \| campaign \| adset \| ad` | `campaign` | Granularity of the breakdown |
| `period_type` | `string` | required | Time period: `YESTERDAY`, `LAST_7_DAYS`, `LAST_30_DAYS`, `LAST_90_DAYS` |
| `time_granularity` | `DAILY \| WEEKLY \| MONTHLY` | `DAILY` | How to bucket data over time |
| `attribution_model` | `string` | `northbeam_custom__va` | Attribution model: `northbeam_custom`, `northbeam_custom__va`, `last_touch`, `first_touch`, `linear` |

Common metric IDs: `spend`, `rev`, `cac`, `aov`, `roas`, `clicks`, `impressions`.
