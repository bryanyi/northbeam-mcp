#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { AuthHeaders, Order, ExportRequest, ExportJobResponse, ExportResultResponse } from "./types/northbeam.js";

const { NORTHBEAM_API_KEY, NORTHBEAM_CLIENT_ID } = process.env;

if (!NORTHBEAM_API_KEY || !NORTHBEAM_CLIENT_ID) {
  console.error("Error: NORTHBEAM_API_KEY and NORTHBEAM_CLIENT_ID environment variables are required.");
  process.exit(1);
}

const API_BASE = "https://api.northbeam.io";

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
      `/v2/orders?start_date=${start_date}&end_date=${end_date}`
    );
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);


const EXPORT_POLL_INTERVAL_MS = 1000;
const EXPORT_TIMEOUT_MS = 60_000;

server.tool(
  "get_marketing_performance",
  `Fetch attributed marketing performance data from Northbeam — use this for questions about ad spend, revenue attribution, CAC, AOV, ROAS, or performance broken down by platform, campaign, adset, or ad. Do NOT use this for order or customer data (use get_orders for that).

Common metric IDs: spend, rev, cac, aov, roas, clicks, impressions.
Common period_type values: YESTERDAY, LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS.
Common attribution_model values: northbeam_custom (clicks only), northbeam_custom__va (clicks + modeled views), last_touch, first_touch, linear.`,
  {
    metrics: z
      .array(z.string())
      .describe("Metric IDs to include, e.g. [\"spend\", \"rev\", \"cac\"]"),
    level: z
      .enum(["platform", "campaign", "adset", "ad"])
      .default("campaign")
      .describe("Granularity of the breakdown"),
    period_type: z
      .string()
      .describe("Time period — always ask the user if not specified. Common values: YESTERDAY, LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS"),
    time_granularity: z
      .enum(["DAILY", "WEEKLY", "MONTHLY"])
      .default("DAILY")
      .describe("How to bucket the data over time"),
    attribution_model: z
      .string()
      .default("northbeam_custom__va")
      .describe("Attribution model ID"),
  },
  async ({ metrics, level, period_type, time_granularity, attribution_model }) => {
    const body: ExportRequest = {
      level,
      time_granularity,
      period_type,
      options: {
        export_aggregation: "BREAKDOWN",
        remove_zero_spend: false,
        aggregate_data: true,
        include_ids: false,
        include_kind_and_platform: true,
      },
      attribution_options: {
        attribution_models: [attribution_model],
        accounting_modes: ["accrual"],
        attribution_windows: ["1"],
      },
      metrics: metrics.map((id) => ({ id })),
    };

    const job = await northbeamFetch<ExportJobResponse>("/v1/exports/data-export", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const deadline = Date.now() + EXPORT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_INTERVAL_MS));

      const result = await northbeamFetch<ExportResultResponse>(
        `/v1/exports/data-export/result/${job.id}`
      );

      if (result.status === "FAILED") {
        throw new Error(`Northbeam export job ${job.id} failed`);
      }

      if (result.status === "SUCCESS" && result.result && result.result.length > 0) {
        const csvResponse = await fetch(result.result[0]);
        if (!csvResponse.ok) {
          throw new Error(`Failed to download export CSV: ${csvResponse.status}`);
        }
        const csv = await csvResponse.text();
        return { content: [{ type: "text", text: csv }] };
      }
    }

    throw new Error(`Northbeam export job ${job.id} timed out after ${EXPORT_TIMEOUT_MS / 1000}s`);
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
