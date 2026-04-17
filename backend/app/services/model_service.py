from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from app.config import settings
from app.models.schemas import ModelSummary, PredictionRow


def load_model_summary(limit: int = 10) -> ModelSummary | None:
    artifact_paths = _resolve_artifact_paths()
    predictions_path = artifact_paths["predictions"]
    metrics_path = artifact_paths["metrics"]
    model_summary_path = artifact_paths["model_summary"]

    if not predictions_path:
        return None

    predictions = pd.read_csv(predictions_path)
    if predictions.empty:
        return None

    test_predictions = predictions.loc[predictions["split"] == "test"].copy()
    if test_predictions.empty:
        test_predictions = predictions.copy()

    test_predictions = test_predictions.sort_values("prediction", ascending=False).reset_index(drop=True)
    test_predictions["rank"] = test_predictions.index + 1
    max_rank = float(len(test_predictions)) if len(test_predictions) else 1.0
    test_predictions["percentile"] = 1.0 - ((test_predictions["rank"] - 1) / max_rank)

    top_rows = _to_prediction_rows(test_predictions.head(limit))
    bottom_rows = _to_prediction_rows(test_predictions.tail(limit).sort_values("prediction", ascending=True))

    metrics = _read_json(metrics_path) if metrics_path else {}
    model_summary = _read_json(model_summary_path) if model_summary_path else {}
    return ModelSummary(
        model_name=model_summary.get("model_name"),
        run_label=_derive_run_label(predictions_path),
        artifact_dir=str(predictions_path.parent),
        metrics=metrics or {},
        top_predictions=top_rows,
        bottom_predictions=bottom_rows,
    )


def get_ticker_prediction(ticker: str) -> dict[str, Any] | None:
    artifact_paths = _resolve_artifact_paths()
    predictions_path = artifact_paths["predictions"]
    if not predictions_path:
        return None

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


def _resolve_artifact_paths() -> dict[str, Path | None]:
    explicit_predictions = settings.lmsa_predictions_csv
    explicit_metrics = settings.lmsa_metrics_json
    explicit_summary = settings.lmsa_model_summary_json

    if explicit_predictions and explicit_predictions.exists():
        return {
            "predictions": explicit_predictions,
            "metrics": explicit_metrics if explicit_metrics and explicit_metrics.exists() else None,
            "model_summary": explicit_summary if explicit_summary and explicit_summary.exists() else None,
        }

    candidate_root = settings.lmsa_results_root
    if not candidate_root or not candidate_root.exists():
        return {"predictions": None, "metrics": None, "model_summary": None}

    best_run_dir = _find_best_run_dir(candidate_root)
    if best_run_dir is None:
        return {"predictions": None, "metrics": None, "model_summary": None}

    predictions = best_run_dir / "predictions.csv"
    metrics = best_run_dir / "metrics.json"
    model_summary = best_run_dir / "model_summary.json"
    return {
        "predictions": predictions if predictions.exists() else None,
        "metrics": metrics if metrics.exists() else None,
        "model_summary": model_summary if model_summary.exists() else None,
    }


def _find_best_run_dir(root: Path) -> Path | None:
    best_dir: Path | None = None
    best_ic = float("-inf")

    for metrics_path in sorted(root.glob("*/metrics.json")):
        metrics = _read_json(metrics_path)
        test_metrics = metrics.get("test", {})
        ic_mean = test_metrics.get("ic_mean")
        if not isinstance(ic_mean, (int, float)):
            continue
        run_dir = metrics_path.parent
        if not (run_dir / "predictions.csv").exists():
            continue
        if float(ic_mean) > best_ic:
            best_ic = float(ic_mean)
            best_dir = run_dir

    return best_dir


def _derive_run_label(path: Path | None) -> str | None:
    if path is None:
        return None
    try:
        return path.parent.name
    except Exception:
        return None
