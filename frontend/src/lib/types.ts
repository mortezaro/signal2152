export type QuoteSnapshot = {
  ticker: string;
  name?: string | null;
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  market_cap?: number | null;
  sector?: string | null;
  industry?: string | null;
  volume?: number | null;
  avg_volume?: number | null;
  currency?: string | null;
  day_low?: number | null;
  day_high?: number | null;
  sparkline: number[];
  sparkline_5d: number[];
  sparkline_1mo: number[];
};

export type PredictionRow = {
  ticker: string;
  split?: string | null;
  prediction: number;
  target?: number | null;
  rank?: number | null;
  percentile?: number | null;
};

export type ModelSummary = {
  model_name?: string | null;
  display_name?: string | null;
  run_label?: string | null;
  artifact_dir?: string | null;
  refreshed_at?: string | null;
  live_date?: string | null;
  is_snapshot: boolean;
  metrics?: Record<string, unknown>;
  top_predictions: PredictionRow[];
  bottom_predictions: PredictionRow[];
};

export type NewsItem = {
  title: string;
  publisher?: string | null;
  link?: string | null;
  published_at?: string | null;
  summary?: string | null;
};

export type DashboardPayload = {
  watchlist: QuoteSnapshot[];
  leaderboard?: ModelSummary | null;
  models: ModelSummary[];
  top_news: NewsItem[];
};

export type PriceBar = {
  date: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
};

export type TickerOverviewPayload = {
  quote: QuoteSnapshot;
  profile?: {
    ticker?: string;
    name?: string | null;
    summary?: string | null;
    website?: string | null;
    country?: string | null;
    city?: string | null;
    employees?: number | null;
    sector?: string | null;
    industry?: string | null;
    exchange?: string | null;
    quote_type?: string | null;
  };
  prediction?: {
    ticker: string;
    latest?: Record<string, unknown>;
    history?: Record<string, unknown>[];
  } | null;
};

export type TickerHistoryPayload = {
  ticker: string;
  bars: PriceBar[];
};

export type TickerNewsPayload = {
  ticker: string;
  items: NewsItem[];
};

export type FinancialRow = {
  label: string;
  values: Record<string, number | null>;
};

export type TickerFinancialsPayload = {
  ticker: string;
  financials: Record<string, FinancialRow[]>;
};
