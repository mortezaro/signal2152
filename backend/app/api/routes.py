from __future__ import annotations

from fastapi import APIRouter, Query

from app.config import settings
from app.models.schemas import DashboardPayload
from app.services.model_service import get_ticker_prediction, load_model_summary
from app.services.yahoo_service import (
    get_company_profile,
    get_financial_summary,
    get_news,
    get_options_summary,
    get_price_history,
    get_quote_snapshot,
    get_watchlist_snapshots,
)


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/dashboard", response_model=DashboardPayload)
def dashboard() -> DashboardPayload:
    watchlist = get_watchlist_snapshots(settings.default_watchlist)
    news = get_news("SPY", limit=6)
    leaderboard = load_model_summary(limit=8)
    return DashboardPayload(
        watchlist=watchlist,
        leaderboard=leaderboard,
        top_news=news,
    )


@router.get("/models/active")
def active_model() -> dict:
    summary = load_model_summary(limit=10)
    return {"model": summary}


@router.get("/tickers/{ticker}/overview")
def ticker_overview(ticker: str) -> dict:
    return {
        "quote": get_quote_snapshot(ticker),
        "profile": get_company_profile(ticker),
        "prediction": get_ticker_prediction(ticker),
    }


@router.get("/tickers/{ticker}/history")
def ticker_history(
    ticker: str,
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
) -> dict:
    return {"ticker": ticker.upper(), "bars": get_price_history(ticker, period=period, interval=interval)}


@router.get("/tickers/{ticker}/financials")
def ticker_financials(ticker: str) -> dict:
    return {"ticker": ticker.upper(), "financials": get_financial_summary(ticker)}


@router.get("/tickers/{ticker}/options")
def ticker_options(
    ticker: str,
    expiration: str | None = Query(default=None),
    option_type: str = Query(default="calls"),
) -> dict:
    return get_options_summary(ticker, expiration=expiration, option_type=option_type)


@router.get("/tickers/{ticker}/news")
def ticker_news(ticker: str, limit: int = Query(default=8, ge=1, le=20)) -> dict:
    return {"ticker": ticker.upper(), "items": get_news(ticker, limit=limit)}
