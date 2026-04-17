from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import HistGradientBoostingRegressor


REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]
UNIVERSE_PATH = BACKEND_ROOT / "data" / "universe" / "starter_100.txt"
ARTIFACT_ROOT = BACKEND_ROOT / "runtime_artifacts" / "models"
SNAPSHOT_SOURCE = REPO_ROOT / "seed_artifacts" / "latent_research_snapshot"

CORE_FEATURES = [
    "return_1d",
    "return_5d",
    "return_10d",
    "volatility_20d",
    "ma_deviation_20d",
    "volume_surprise_20d",
    "range_volatility_10d",
    "beta_to_market_60d",
    "market_return_1d",
    "market_return_5d",
    "market_volatility_20d",
    "market_breadth_1d",
]


@dataclass
class RidgeRegressor:
    alpha: float = 1.0
    coef_: np.ndarray | None = None
    intercept_: float = 0.0

    def fit(self, x: np.ndarray, y: np.ndarray) -> "RidgeRegressor":
        x_mean = x.mean(axis=0)
        y_mean = float(y.mean())
        x_centered = x - x_mean
        y_centered = y - y_mean
        identity = np.eye(x.shape[1], dtype=float)
        self.coef_ = np.linalg.solve(x_centered.T @ x_centered + self.alpha * identity, x_centered.T @ y_centered)
        self.intercept_ = float(y_mean - x_mean @ self.coef_)
        return self

    def predict(self, x: np.ndarray) -> np.ndarray:
        assert self.coef_ is not None
        return x @ self.coef_ + self.intercept_


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh semi-live model artifacts for the dashboard.")
    parser.add_argument("--period", default="6y")
    parser.add_argument("--top-n", type=int, default=100)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    tickers = [line.strip() for line in UNIVERSE_PATH.read_text().splitlines() if line.strip()]
    prices = download_prices(tickers=tickers, period=args.period)
    dataset, live_frame = build_dataset(prices=prices, top_n=args.top_n)

    ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
    refresh_at = datetime.now(UTC).isoformat()

    split_frames = split_labeled_dataset(dataset)
    train = split_frames["train"]
    valid = split_frames["valid"]
    test = split_frames["test"]

    run_linear_model(
        run_name="ridge_live_context",
        display_name="Ridge Live Context",
        model=RidgeRegressor(alpha=1.0),
        split_frames=split_frames,
        live_frame=live_frame,
        refresh_at=refresh_at,
    )
    run_gbdt_model(
        run_name="gbdt_live_context",
        display_name="GBDT Live Context",
        split_frames=split_frames,
        live_frame=live_frame,
        refresh_at=refresh_at,
    )
    copy_snapshot_if_available(refresh_at=refresh_at)

    summary = {
        "refreshed_at": refresh_at,
        "n_tickers": len(tickers),
        "n_train_rows": int(len(train)),
        "n_valid_rows": int(len(valid)),
        "n_test_rows": int(len(test)),
        "latest_live_date": str(live_frame["date"].max().date()) if not live_frame.empty else None,
    }
    (ARTIFACT_ROOT / "_refresh_summary.json").write_text(json.dumps(summary, indent=2))


def download_prices(tickers: list[str], period: str) -> pd.DataFrame:
    raw = yf.download(
        tickers=tickers,
        period=period,
        interval="1d",
        auto_adjust=False,
        group_by="ticker",
        progress=False,
        threads=False,
    )
    if raw.empty:
        raise RuntimeError("No price data downloaded from yfinance.")

    rows: list[pd.DataFrame] = []
    if isinstance(raw.columns, pd.MultiIndex):
        for ticker in tickers:
            if ticker not in raw.columns.get_level_values(0):
                continue
            frame = raw[ticker].copy().reset_index()
            frame.columns = [str(column).lower().replace(" ", "_") for column in frame.columns]
            frame["ticker"] = ticker
            rows.append(frame)
    else:
        frame = raw.copy().reset_index()
        frame.columns = [str(column).lower().replace(" ", "_") for column in frame.columns]
        frame["ticker"] = tickers[0]
        rows.append(frame)

    prices = pd.concat(rows, ignore_index=True)
    prices = prices.rename(columns={"adj_close": "adjusted_close"})
    prices["date"] = pd.to_datetime(prices["date"])
    prices["ticker"] = prices["ticker"].astype(str).str.upper()
    prices["adjusted_close"] = prices["adjusted_close"].fillna(prices["close"])
    prices["dollar_volume"] = prices["close"] * prices["volume"]
    prices = prices.dropna(subset=["date", "ticker", "open", "high", "low", "close", "volume"])
    return prices.sort_values(["date", "ticker"]).reset_index(drop=True)


def build_dataset(prices: pd.DataFrame, top_n: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    universe = build_point_in_time_universe(prices, top_n=top_n)

    frame = prices.merge(universe[["date", "ticker", "in_universe"]], on=["date", "ticker"], how="left")
    frame["in_universe"] = frame["in_universe"].fillna(False)
    frame = frame.sort_values(["ticker", "date"]).reset_index(drop=True)

    grouped = frame.groupby("ticker", group_keys=False)
    adjusted_close = frame["adjusted_close"]
    volume = frame["volume"]

    frame["return_1d"] = grouped["adjusted_close"].transform(lambda s: s.pct_change(1))
    frame["return_5d"] = grouped["adjusted_close"].transform(lambda s: s.pct_change(5))
    frame["return_10d"] = grouped["adjusted_close"].transform(lambda s: s.pct_change(10))
    frame["volatility_20d"] = grouped["adjusted_close"].transform(lambda s: s.pct_change().rolling(20, min_periods=20).std())
    frame["ma_deviation_20d"] = adjusted_close / grouped["adjusted_close"].transform(lambda s: s.rolling(20, min_periods=20).mean()) - 1.0
    frame["avg_dollar_volume_20d"] = grouped["dollar_volume"].transform(lambda s: s.shift(1).rolling(20, min_periods=20).mean())
    frame["volume_surprise_20d"] = volume / grouped["volume"].transform(lambda s: s.shift(1).rolling(20, min_periods=20).mean()) - 1.0
    frame["intraday_range"] = (frame["high"] - frame["low"]) / frame["close"]
    frame["range_volatility_10d"] = grouped["intraday_range"].transform(lambda s: s.rolling(10, min_periods=10).mean())

    market_return_1d = frame.groupby("date")["return_1d"].transform("mean")
    frame["beta_to_market_60d"] = grouped["return_1d"].transform(lambda s: rolling_beta(s, market_return_1d.loc[s.index], window=60))
    frame["market_return_1d"] = market_return_1d
    frame["market_return_5d"] = frame.groupby("date")["return_5d"].transform("mean")
    market_daily = frame.groupby("date", as_index=False)["return_1d"].mean().rename(columns={"return_1d": "market_return_daily"})
    market_daily["market_volatility_20d"] = market_daily["market_return_daily"].rolling(20, min_periods=20).std()
    breadth = (
        frame.assign(is_positive_return=frame["return_1d"] > 0)
        .groupby("date", as_index=False)["is_positive_return"]
        .mean()
        .rename(columns={"is_positive_return": "market_breadth_1d"})
    )
    frame = frame.merge(market_daily[["date", "market_volatility_20d"]].merge(breadth, on="date", how="left"), on="date", how="left")

    frame["target_excess_return_5d"] = future_excess_return(frame, horizon_days=5)
    labeled = frame.loc[frame["in_universe"]].copy()
    labeled = labeled.dropna(subset=CORE_FEATURES + ["target_excess_return_5d"]).reset_index(drop=True)

    live_date = frame.loc[frame["in_universe"], "date"].max()
    live_frame = frame.loc[(frame["in_universe"]) & (frame["date"] == live_date)].copy()
    live_frame = live_frame.dropna(subset=CORE_FEATURES).reset_index(drop=True)
    return labeled, live_frame


def split_labeled_dataset(dataset: pd.DataFrame) -> dict[str, pd.DataFrame]:
    unique_dates = sorted(pd.to_datetime(dataset["date"]).unique())
    if len(unique_dates) < 180:
        raise RuntimeError("Not enough history to build train/valid/test splits.")

    test_size = min(126, max(63, len(unique_dates) // 5))
    valid_size = min(126, max(63, len(unique_dates) // 5))
    test_start = unique_dates[-test_size]
    valid_start = unique_dates[-(test_size + valid_size)]

    train = dataset.loc[dataset["date"] < valid_start].copy()
    valid = dataset.loc[(dataset["date"] >= valid_start) & (dataset["date"] < test_start)].copy()
    test = dataset.loc[dataset["date"] >= test_start].copy()
    if train.empty or valid.empty or test.empty:
        raise RuntimeError("One or more live scoring splits are empty.")
    return {"train": train, "valid": valid, "test": test}


def run_linear_model(run_name: str, display_name: str, model: RidgeRegressor, split_frames: dict[str, pd.DataFrame], live_frame: pd.DataFrame, refresh_at: str) -> None:
    artifact_dir = ARTIFACT_ROOT / run_name
    artifact_dir.mkdir(parents=True, exist_ok=True)

    x_train = split_frames["train"][CORE_FEATURES].to_numpy(dtype=float)
    y_train = split_frames["train"]["target_excess_return_5d"].to_numpy(dtype=float)
    model.fit(x_train, y_train)
    write_artifacts(
        artifact_dir=artifact_dir,
        run_name=run_name,
        display_name=display_name,
        split_frames=score_splits(model, split_frames, live_frame),
        refresh_at=refresh_at,
        model_name="ridge",
    )


def run_gbdt_model(run_name: str, display_name: str, split_frames: dict[str, pd.DataFrame], live_frame: pd.DataFrame, refresh_at: str) -> None:
    artifact_dir = ARTIFACT_ROOT / run_name
    artifact_dir.mkdir(parents=True, exist_ok=True)

    model = HistGradientBoostingRegressor(
        learning_rate=0.05,
        max_depth=4,
        max_iter=300,
        min_samples_leaf=50,
        random_state=7,
    )
    x_train = split_frames["train"][CORE_FEATURES].to_numpy(dtype=float)
    y_train = split_frames["train"]["target_excess_return_5d"].to_numpy(dtype=float)
    model.fit(x_train, y_train)
    write_artifacts(
        artifact_dir=artifact_dir,
        run_name=run_name,
        display_name=display_name,
        split_frames=score_splits(model, split_frames, live_frame),
        refresh_at=refresh_at,
        model_name="hist_gbdt",
    )


def score_splits(model, split_frames: dict[str, pd.DataFrame], live_frame: pd.DataFrame) -> dict[str, pd.DataFrame]:
    output: dict[str, pd.DataFrame] = {}
    for split_name, frame in split_frames.items():
        scored = frame.copy()
        scored["prediction"] = model.predict(scored[CORE_FEATURES].to_numpy(dtype=float))
        scored["split"] = split_name
        output[split_name] = scored

    live = live_frame.copy()
    live["prediction"] = model.predict(live[CORE_FEATURES].to_numpy(dtype=float))
    live["split"] = "live"
    output["live"] = live
    return output


def write_artifacts(
    artifact_dir: Path,
    run_name: str,
    display_name: str,
    split_frames: dict[str, pd.DataFrame],
    refresh_at: str,
    model_name: str,
) -> None:
    metrics = {
        split_name: regression_metrics(frame, prediction_col="prediction", target_col="target_excess_return_5d")
        for split_name, frame in split_frames.items()
        if split_name != "live"
    }

    combined = pd.concat(
        [
            frame[["date", "ticker", "split", "prediction"] + (["target_excess_return_5d"] if "target_excess_return_5d" in frame.columns else [])]
            for frame in split_frames.values()
        ],
        ignore_index=True,
    )

    live_frame = split_frames["live"].sort_values("prediction", ascending=False).reset_index(drop=True)
    live_frame["rank"] = live_frame.index + 1
    max_rank = max(1, len(live_frame))
    live_frame["percentile"] = 1.0 - ((live_frame["rank"] - 1) / max_rank)
    live_prediction_rows = live_frame[
        ["date", "ticker", "split", "prediction", "rank", "percentile"]
        + (["target_excess_return_5d"] if "target_excess_return_5d" in live_frame.columns else [])
    ].copy()

    predictions = pd.concat([combined, live_prediction_rows], ignore_index=True)
    predictions.to_csv(artifact_dir / "predictions.csv", index=False)

    model_summary = {
        "model_name": model_name,
        "display_name": display_name,
        "run_name": run_name,
        "feature_columns": CORE_FEATURES,
        "target_column": "target_excess_return_5d",
        "refreshed_at": refresh_at,
        "live_date": str(pd.to_datetime(live_frame["date"].iloc[0]).date()) if not live_frame.empty else None,
        "n_live_names": int(len(live_frame)),
    }
    (artifact_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (artifact_dir / "model_summary.json").write_text(json.dumps(model_summary, indent=2))


def copy_snapshot_if_available(refresh_at: str) -> None:
    if not SNAPSHOT_SOURCE.exists():
        return
    target = ARTIFACT_ROOT / "latent_research_snapshot"
    target.mkdir(parents=True, exist_ok=True)
    for name in ["predictions.csv", "metrics.json", "model_summary.json"]:
        source_path = SNAPSHOT_SOURCE / name
        if source_path.exists():
            target.joinpath(name).write_bytes(source_path.read_bytes())
    summary_path = target / "model_summary.json"
    if summary_path.exists():
        data = json.loads(summary_path.read_text())
    else:
        data = {}
    data["display_name"] = data.get("display_name", "Latent Research Snapshot")
    data["run_name"] = data.get("run_name", "latent_research_snapshot")
    data["refreshed_at"] = refresh_at
    data["snapshot"] = True
    summary_path.write_text(json.dumps(data, indent=2))


def build_point_in_time_universe(prices: pd.DataFrame, top_n: int, min_history_days: int = 252, dollar_volume_window_days: int = 20) -> pd.DataFrame:
    universe = prices[["date", "ticker", "dollar_volume"]].copy()
    universe["history_days"] = prices.groupby("ticker").cumcount() + 1
    universe["avg_dollar_volume"] = prices.groupby("ticker")["dollar_volume"].transform(lambda s: s.shift(1).rolling(dollar_volume_window_days, min_periods=dollar_volume_window_days).mean())
    universe["eligible"] = (universe["history_days"] >= min_history_days) & universe["avg_dollar_volume"].notna()
    eligible = universe[universe["eligible"]].copy()
    eligible["liquidity_rank"] = eligible.groupby("date")["avg_dollar_volume"].rank(ascending=False, method="first")
    eligible["in_universe"] = eligible["liquidity_rank"] <= top_n
    result = universe[["date", "ticker", "history_days", "avg_dollar_volume", "eligible"]].merge(
        eligible[["date", "ticker", "liquidity_rank", "in_universe"]],
        on=["date", "ticker"],
        how="left",
    )
    result["in_universe"] = result["in_universe"].astype("boolean").fillna(False).astype(bool)
    return result.sort_values(["date", "ticker"]).reset_index(drop=True)


def future_excess_return(frame: pd.DataFrame, horizon_days: int, price_col: str = "adjusted_close") -> pd.Series:
    future_return = frame.groupby("ticker")[price_col].transform(lambda s: s.shift(-horizon_days) / s - 1.0)
    return future_return - future_return.groupby(frame["date"]).transform("mean")


def rolling_beta(asset_returns: pd.Series, market_returns: pd.Series, window: int) -> pd.Series:
    mean_asset = asset_returns.rolling(window, min_periods=window).mean()
    mean_market = market_returns.rolling(window, min_periods=window).mean()
    covariance = (asset_returns * market_returns).rolling(window, min_periods=window).mean() - mean_asset * mean_market
    variance = market_returns.rolling(window, min_periods=window).var(ddof=0)
    return (covariance / variance.replace(0.0, pd.NA)).astype(float)


def regression_metrics(frame: pd.DataFrame, prediction_col: str, target_col: str) -> dict[str, float]:
    errors = frame[prediction_col] - frame[target_col]
    ic_series = daily_spearman_ic(frame, score_col=prediction_col, target_col=target_col).dropna()
    return {
        "mse": float(np.mean(np.square(errors))),
        "rmse": float(np.sqrt(np.mean(np.square(errors)))),
        "ic_mean": float(ic_series.mean()) if not ic_series.empty else 0.0,
        "ic_tstat": tstat(ic_series),
        "n_rows": int(len(frame)),
        "n_days": int(frame["date"].nunique()),
    }


def daily_spearman_ic(frame: pd.DataFrame, score_col: str, target_col: str) -> pd.Series:
    def corr(group: pd.DataFrame) -> float:
        scores = group[score_col].rank()
        targets = group[target_col].rank()
        return float(scores.corr(targets, method="pearson"))

    return frame.groupby("date").apply(corr)


def tstat(series: pd.Series) -> float:
    if len(series) < 2 or series.std(ddof=1) == 0:
        return 0.0
    return float(math.sqrt(len(series)) * series.mean() / series.std(ddof=1))


if __name__ == "__main__":
    main()
