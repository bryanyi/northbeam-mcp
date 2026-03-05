export interface AuthHeaders {
  Authorization: string;
  "Data-Client-ID": string;
  "Content-Type": string;
}

export interface DateRangeParams {
  start_date: string;
  end_date: string;
}

export interface OrderProduct {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  order_id: string;
  customer_id: string;
  time_of_purchase: string;
  currency: string;
  purchase_total: number;
  tax: number;
  products: OrderProduct[];
}

export interface ExportRequest {
  level?: "platform" | "campaign" | "adset" | "ad";
  time_granularity?: "DAILY" | "WEEKLY" | "MONTHLY";
  period_type?: string;
  options?: {
    export_aggregation?: "BREAKDOWN" | "AGGREGATE";
    remove_zero_spend?: boolean;
    aggregate_data?: boolean;
    include_ids?: boolean;
    include_kind_and_platform?: boolean;
  };
  attribution_options: {
    attribution_models: string[];
    accounting_modes: string[];
    attribution_windows: string[];
  };
  metrics: Array<{ id: string; label?: string }>;
}

export interface ExportJobResponse {
  id: string;
}

export interface ExportResultResponse {
  data_export_id: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  result?: string[];
  created_at: string;
  finished_at?: string;
}
