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

export interface SpendEntry {
  date: string;
  platform_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  spend_currency: string;
  platform_account_id?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions?: number;
  clicks?: number;
}
