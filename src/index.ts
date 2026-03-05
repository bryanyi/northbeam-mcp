#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { AuthHeaders, Order } from "./types/northbeam.js";

const { NORTHBEAM_API_KEY, NORTHBEAM_CLIENT_ID } = process.env;

if (!NORTHBEAM_API_KEY || !NORTHBEAM_CLIENT_ID) {
  console.error("Error: NORTHBEAM_API_KEY and NORTHBEAM_CLIENT_ID environment variables are required.");
  process.exit(1);
}

const API_BASE = "https://api.northbeam.io/v1";

const AUTH_HEADERS: AuthHeaders = {
  Authorization: NORTHBEAM_API_KEY,
  "Data-Client-ID": NORTHBEAM_CLIENT_ID,
  "Content-Type": "application/json",
};

async function northbeamFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...AUTH_HEADERS, ...options.headers },
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Northbeam API ${response.status}: ${body}`);
  }

  return JSON.parse(body);
}

const server = new McpServer({
  name: "northbeam",
  version: "1.0.0",
});

server.tool(
  "get_orders",
  "Fetch orders from Northbeam within a date range.",
  {
    start_date: z.string().describe("Start date in YYYY-MM-DD format"),
    end_date: z.string().describe("End date in YYYY-MM-DD format"),
  },
  async ({ start_date, end_date }) => {
    const data = await northbeamFetch<Order[]>(
      `/orders?start_date=${start_date}&end_date=${end_date}`
    );
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);


const transport = new StdioServerTransport();
await server.connect(transport);
