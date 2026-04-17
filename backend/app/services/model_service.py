from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from app.config import settings
from app.models.schemas import ModelSummary, PredictionRow


def load_model_summary(limit: int = 10) -> ModelSummary | None:
    models = load_all_model_summaries(limit=limit)
    if not models:
        return None
    return max(models, key=_model_sort_key)


def load_all_model_summaries(limit: int = 10) -> list[ModelSummary]:
    root = settings.lmsa_results_root
    if not root or not root.exists():
        return []

    models: list[ModelSummary] = []
    for run_dir in sorted(path for path in root.iterdir() if path.is_dir()):
        summary = _load_model_summary_from_run(run_dir=run_dir, limit=limit)
        if summary is not None:
            models.append(summary)

    return sorted(models, key=_model_sort_key, reverse=True)


def get_ticker_prediction(ticker: str) -> dict[str, Any] | None:
    leader = load_model_summary(limit=10)
    if leader is None or not leader.artifact_dir:
        return None

    predictions_path = Path(leader.artifact_dir) / "predictions.csv"
    predictions = pd.read_csv(predictions_path)
    if predictions.empty:
        return None

    frame = predictions.loc[predictions["ticker"].astype(str).str.upper() == ticker.upper()].copy()
    if frame.empty:
        return None

    frame = frame.sort_values(["split", "date"]).reset_index(drop=True)
    latest = frame.iloc[-1].to_dict()
    return {
        "ticker": ticker.upper(),
        "latest": latest,
        "history": frame.tail(60).to_dict(orient="records"),
    }


def _to_prediction_rows(frame: pd.DataFrame) -> list[PredictionRow]:
    rows: list[PredictionRow] = []
    target_column = "target_excess_return_5d" if "target_excess_return_5d" in frame.columns else None
    for _, row in frame.iterrows():
        rows.append(
            PredictionRow(
                ticker=str(row["ticker"]).upper(),
                split=row.get("split"),
                prediction=float(row["prediction"]),
                target=float(row[target_column]) if target_column and pd.notna(row.get(target_column)) else None,
                rank=int(row["rank"]) if pd.notna(row.get("rank")) else None,
                percentile=float(row["percentile"]) if pd.notna(row.get("percentile")) else None,
            )
        )
    return rows


def _read_json(path: Path | None) -> dict[str, Any]:
    if not path or not path.exists():
        return {}
    return json.loads(path.read_text())


def _load_model_summary_from_run(run_dir: Path, limit: int) -> ModelSummary | None:
    predictions_path = run_dir / "predictions.csv"
    metrics_path = run_dir / "metrics.json"
    model_summary_path = run_dir / "model_summary.json"
    if not predictions_path.exists():
        return None

    predictions = pd.read_csv(predictions_path)
    if predictions.empty:
        return None

    live_predictions = predictions.loc[predictions["split"] == "live"].copy()
    if live_predictions.empty:
        test_predictions = predictions.loc[predictions["split"] == "test"].copy()
        if test_predictions.empty:
            live_predictions = predictions.copy()
        else:
            live_predictions = test_predictions

    live_predictions = live_predictions.sort_values("prediction", ascending=False).reset_index(drop=True)
    live_predictions["rank"] = live_predictions.index + 1
    max_rank = float(len(live_predictions)) if len(live_predictions) else 1.0
    live_predictions["percentile"] = 1.0 - ((live_predictions["rank"] - 1) / max_rank)

    metrics = _read_json(metrics_path)
    model_data = _read_json(model_summary_path)
    return ModelSummary(
        model_name=model_data.get("model_name"),
        display_name=model_data.get("display_name") or _derive_run_label(predictions_path),
        run_label=model_data.get("run_name") or _derive_run_label(predictions_path),
        artifact_dir=str(run_dir),
        refreshed_at=model_data.get("refreshed_at"),
        live_date=model_data.get("live_date"),
        metrics=metrics or {},
        top_predictions=_to_prediction_rows(live_predictions.head(limit)),
        bottom_predictions=_to_prediction_rows(live_predictions.tail(limit).sort_values("prediction", ascending=True)),
    )


def _model_sort_key(summary: ModelSummary) -> tuple[float, float]:
    test_metrics = summary.metrics.get("test", {}) if summary.metrics else {}
    ic_mean = test_metrics.get("ic_mean", 0.0)
    tstat = test_metrics.get("ic_tstat", 0.0)
    try:
        return (float(ic_mean), float(tstat))
    except (TypeError, ValueError):
        return (0.0, 0.0)


def _derive_run_label(path: Path | None) -> str | None:
    if path is None:
        return None
    try:
        return path.parent.name
    except Exception:
        return None
