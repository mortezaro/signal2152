import type {
  DashboardPayload,
  TickerFinancialsPayload,
  TickerHistoryPayload,
  TickerNewsPayload,
  TickerOverviewPayload,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

export async function getDashboard(): Promise<DashboardPayload> {
  const response = await fetch(`${API_BASE}/dashboard`);
  if (!response.ok) {
    throw new Error(`Failed to load dashboard: ${response.status}`);
  }
  return response.json();
}

export async function getTickerOverview(ticker: string): Promise<TickerOverviewPayload> {
  const response = await fetch(`${API_BASE}/tickers/${encodeURIComponent(ticker)}/overview`);
  if (!response.ok) {
    throw new Error(`Failed to load ticker overview: ${response.status}`);
  }
  return response.json();
}

export async function getTickerHistory(ticker: string, period = "1mo", interval = "1d"): Promise<TickerHistoryPayload> {
  const response = await fetch(
    `${API_BASE}/tickers/${encodeURIComponent(ticker)}/history?period=${period}&interval=${interval}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to load ticker history: ${response.status}`);
  }
  return response.json();
}

export async function getTickerNews(ticker: string, limit = 6): Promise<TickerNewsPayload> {
  const response = await fetch(`${API_BASE}/tickers/${encodeURIComponent(ticker)}/news?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to load ticker news: ${response.status}`);
  }
  return response.json();
}

export async function getTickerFinancials(ticker: string): Promise<TickerFinancialsPayload> {
  const response = await fetch(`${API_BASE}/tickers/${encodeURIComponent(ticker)}/financials`);
  if (!response.ok) {
    throw new Error(`Failed to load ticker financials: ${response.status}`);
  }
  return response.json();
}
