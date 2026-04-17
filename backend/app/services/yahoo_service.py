from __future__ import annotations

from typing import Any

import pandas as pd
import yfinance as yf

from app.models.schemas import FinancialRow, NewsItem, OptionContract, PriceBar, QuoteSnapshot


def get_quote_snapshot(ticker: str) -> QuoteSnapshot:
    stock = yf.Ticker(ticker)
    info = stock.info
    return QuoteSnapshot(
        ticker=ticker.upper(),
        name=info.get("shortName") or info.get("longName"),
        price=_to_float(info.get("currentPrice") or info.get("regularMarketPrice")),
        change=_to_float(info.get("regularMarketChange")),
        change_percent=_to_float(info.get("regularMarketChangePercent")),
        market_cap=_to_float(info.get("marketCap")),
        sector=info.get("sector"),
        industry=info.get("industry"),
        volume=_to_float(info.get("volume")),
        avg_volume=_to_float(info.get("averageVolume")),
        currency=info.get("currency"),
        day_low=_to_float(info.get("dayLow") or info.get("regularMarketDayLow")),
        day_high=_to_float(info.get("dayHigh") or info.get("regularMarketDayHigh")),
        sparkline=_get_intraday_sparkline(stock),
        sparkline_5d=_get_sparkline(stock, period="5d", interval="30m", limit=24),
        sparkline_1mo=_get_sparkline(stock, period="1mo", interval="1d", limit=24),
    )


def get_watchlist_snapshots(tickers: list[str]) -> list[QuoteSnapshot]:
    return [get_quote_snapshot(ticker) for ticker in tickers]


def get_price_history(ticker: str, period: str = "6mo", interval: str = "1d") -> list[PriceBar]:
    history = yf.Ticker(ticker).history(period=period, interval=interval, auto_adjust=False)
    if history.empty:
        return []
    history = history.reset_index()
    date_column = "Date" if "Date" in history.columns else history.columns[0]
    return [
        PriceBar(
            date=pd.to_datetime(row[date_column]).strftime("%Y-%m-%d"),
            open=_to_float(row.get("Open")),
            high=_to_float(row.get("High")),
            low=_to_float(row.get("Low")),
            close=_to_float(row.get("Close")),
            volume=_to_float(row.get("Volume")),
        )
        for _, row in history.iterrows()
    ]


def get_company_profile(ticker: str) -> dict[str, Any]:
    info = yf.Ticker(ticker).info
    return {
        "ticker": ticker.upper(),
        "name": info.get("longName") or info.get("shortName"),
        "summary": info.get("longBusinessSummary"),
        "website": info.get("website"),
        "country": info.get("country"),
        "city": info.get("city"),
        "employees": info.get("fullTimeEmployees"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "exchange": info.get("exchange"),
        "quote_type": info.get("quoteType"),
    }


def get_news(ticker: str, limit: int = 8) -> list[NewsItem]:
    news = yf.Ticker(ticker).news or []
    items: list[NewsItem] = []
    for item in news[:limit]:
        content = item.get("content") or {}
        items.append(
            NewsItem(
                title=content.get("title") or item.get("title") or "Untitled",
                publisher=content.get("provider", {}).get("displayName") or item.get("publisher"),
                link=content.get("canonicalUrl", {}).get("url") or item.get("link"),
                published_at=content.get("pubDate") or item.get("providerPublishTime"),
                summary=content.get("summary"),
            )
        )
    return items


def get_options_summary(ticker: str, expiration: str | None = None, option_type: str = "calls") -> dict[str, Any]:
    stock = yf.Ticker(ticker)
    expirations = list(stock.options or [])
    if not expirations:
        return {"ticker": ticker.upper(), "expirations": [], "contracts": []}
    chosen_expiration = expiration or expirations[0]
    chain = stock.option_chain(chosen_expiration)
    frame = chain.calls if option_type == "calls" else chain.puts
    contracts = [
        OptionContract(
            strike=_to_float(row.get("strike")),
            last_price=_to_float(row.get("lastPrice")),
            bid=_to_float(row.get("bid")),
            ask=_to_float(row.get("ask")),
            volume=_to_float(row.get("volume")),
            open_interest=_to_float(row.get("openInterest")),
            implied_volatility=_to_float(row.get("impliedVolatility")),
            in_the_money=bool(row.get("inTheMoney")) if row.get("inTheMoney") is not None else None,
        )
        for _, row in frame.head(20).iterrows()
    ]
    return {
        "ticker": ticker.upper(),
        "selected_expiration": chosen_expiration,
        "expirations": expirations,
        "option_type": option_type,
        "contracts": contracts,
    }


def get_financial_summary(ticker: str) -> dict[str, list[FinancialRow]]:
    stock = yf.Ticker(ticker)
    financial_sets = {
        "income_statement": stock.financials,
        "balance_sheet": stock.balance_sheet,
        "cash_flow": stock.cashflow,
    }
    payload: dict[str, list[FinancialRow]] = {}
    for key, frame in financial_sets.items():
        if frame is None or frame.empty:
            payload[key] = []
            continue
        reduced = frame.head(10)
        payload[key] = [
            FinancialRow(
                label=str(index),
                values={str(col.date() if hasattr(col, "date") else col): _to_float(value) for col, value in row.items()},
            )
            for index, row in reduced.iterrows()
        ]
    return payload


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _get_intraday_sparkline(stock: yf.Ticker) -> list[float]:
    history = stock.history(period="1d", interval="30m", auto_adjust=False)
    if history.empty or "Close" not in history.columns:
        return []
    closes = history["Close"].dropna().astype(float)
    if closes.empty:
        return []
    return closes.tail(16).round(4).tolist()


def _get_sparkline(stock: yf.Ticker, period: str, interval: str, limit: int = 24) -> list[float]:
    history = stock.history(period=period, interval=interval, auto_adjust=False)
    if history.empty or "Close" not in history.columns:
        return []
    closes = history["Close"].dropna().astype(float)
    if closes.empty:
        return []
    return closes.tail(limit).round(4).tolist()
