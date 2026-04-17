from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Market State Dashboard API"
    app_env: str = "development"
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    lmsa_predictions_csv: Path | None = None
    lmsa_metrics_json: Path | None = None
    lmsa_model_summary_json: Path | None = None
    lmsa_results_root: Path | None = Path("/Users/morteza/Documents/Playground/market-state-dashboard/backend/runtime_artifacts/models")
    default_watchlist: list[str] = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "SPY"]

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
    )


settings = Settings()
