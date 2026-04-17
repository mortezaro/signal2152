from __future__ import annotations

import json
from pathlib import Path


SOURCE_ROOT = Path("/Users/morteza/Documents/Playground/latent-market-state-alpha/results/runs/latent_ranked_starter_v1")
TARGET_ROOT = Path(__file__).resolve().parents[3] / "seed_artifacts" / "latent_research_snapshot"


def main() -> None:
    TARGET_ROOT.mkdir(parents=True, exist_ok=True)
    for name in ["predictions.csv", "metrics.json", "model_summary.json"]:
        source = SOURCE_ROOT / name
        if not source.exists():
            continue
        TARGET_ROOT.joinpath(name).write_bytes(source.read_bytes())

    summary_path = TARGET_ROOT / "model_summary.json"
    if summary_path.exists():
        data = json.loads(summary_path.read_text())
    else:
        data = {}
    data["display_name"] = "Latent Research Snapshot"
    data["run_name"] = "latent_research_snapshot"
    summary_path.write_text(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
