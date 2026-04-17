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
