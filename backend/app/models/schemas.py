from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class QuoteSnapshot(BaseModel):
    ticker: str
    name: str | None = None
    price: float | None = None
    change: float | None = None
    change_percent: float | None = None
    market_cap: float | None = None
    sector: str | None = None
    industry: str | None = None
    volume: float | None = None
    avg_volume: float | None = None
    currency: str | None = None


class PriceBar(BaseModel):
    date: str
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    volume: float | None = None


class NewsItem(BaseModel):
    title: str
    publisher: str | None = None
    link: str | None = None
    published_at: str | None = None
    summary: str | None = None


class OptionContract(BaseModel):
    strike: float | None = None
    last_price: float | None = None
    bid: float | None = None
    ask: float | None = None
    volume: float | None = None
    open_interest: float | None = None
    implied_volatility: float | None = None
    in_the_money: bool | None = None


class FinancialRow(BaseModel):
    label: str
    values: dict[str, float | None]


class PredictionRow(BaseModel):
    ticker: str
    split: str | None = None
    prediction: float
    target: float | None = None
    rank: int | None = None
    percentile: float | None = None


class ModelSummary(BaseModel):
    model_name: str | None = None
    run_label: str | None = None
    display_name: str | None = None
    artifact_dir: str | None = None
    refreshed_at: str | None = None
    live_date: str | None = None
    metrics: dict[str, Any] = Field(default_factory=dict)
    top_predictions: list[PredictionRow] = Field(default_factory=list)
    bottom_predictions: list[PredictionRow] = Field(default_factory=list)


class DashboardPayload(BaseModel):
    watchlist: list[QuoteSnapshot]
    leaderboard: ModelSummary | None = None
    models: list[ModelSummary] = Field(default_factory=list)
    top_news: list[NewsItem] = Field(default_factory=list)
