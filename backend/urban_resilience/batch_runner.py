# backend/urban_resilience/batch_runner.py

from __future__ import annotations

from pathlib import Path
from datetime import datetime
from typing import List

import pandas as pd

from backend.urban_resilience.config import (
    DEFAULT_CITIES,
    SCENARIOS,
    SEVERITIES,
    N_PAIRS_PER_RUN,
    RUNS_PER_SETTING,
)
from backend.urban_resilience.experiments import run_single_scenario_for_city


def run_full_batch() -> pd.DataFrame:
    """
    Run all (city, scenario, severity) combinations and
    return a single concatenated DataFrame.

    Each row in the result is ONE run of:
        - one city
        - one scenario
        - one severity
        - with `N_PAIRS_PER_RUN` OD pairs
    """
    all_results: List[pd.DataFrame] = []

    total_jobs = (
        len(DEFAULT_CITIES)
        * len(SCENARIOS)
        * len(SEVERITIES)
    )
    job_idx = 0

    for city in DEFAULT_CITIES:
        for scenario in SCENARIOS:
            for severity in SEVERITIES:
                job_idx += 1
                print(
                    f"[{job_idx}/{total_jobs}] "
                    f"{city} | {scenario} | severity={severity}"
                )

                df = run_single_scenario_for_city(
                    city=city,
                    scenario=scenario,
                    severity=severity,
                    n_pairs=N_PAIRS_PER_RUN,
                    runs=RUNS_PER_SETTING,
                    seed=42,  # fixed seed → reproducible RNG stream
                )

                # Sanity: make sure core columns exist
                required_cols = {"city", "scenario", "severity", "run"}
                missing = required_cols - set(df.columns)
                if missing:
                    raise ValueError(
                        f"Missing expected columns from run_single_scenario_for_city: {missing}"
                    )

                # Quick debug print for top-level metrics if present
                if "delay_ratio" in df.columns and "disconnected_od_ratio" in df.columns:
                    mean_delay = df["delay_ratio"].mean()
                    mean_disc = df["disconnected_od_ratio"].mean()
                    print(
                        f"    -> mean delay_ratio={mean_delay:.3f}, "
                        f"mean disconnected_od_ratio={mean_disc:.3f}"
                    )

                all_results.append(df)

    full_df = pd.concat(all_results, ignore_index=True)
    return full_df


def save_batch_results(df: pd.DataFrame) -> Path:
    """
    Save the batch DataFrame to a timestamped CSV and return the path.
    """
    out_dir = Path("data/batch_results")
    out_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = out_dir / f"urban_resilience_batch_{ts}.csv"

    df.to_csv(out_path, index=False)
    print(f"\n[OK] Saved {len(df)} rows to {out_path}")
    return out_path


def main() -> None:
    df = run_full_batch()
    save_batch_results(df)


if __name__ == "__main__":
    main()