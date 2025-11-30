# backend/urban_resilience/run_multi_city.py

from __future__ import annotations
import os
from typing import List, Optional

import pandas as pd

from .config import DEFAULT_CITIES, SCENARIOS
from .experiments import run_single_scenario_for_city


def run_experiments(
    cities: Optional[List[str]] = None,
    scenarios: Optional[List[str]] = None,
    severities: Optional[List[float]] = None,
    n_pairs: int = 20,
    runs_per_severity: int = 3,
    output_csv: str = "multi_city_results.csv",
    seed: Optional[int] = None,
):
    """
    Offline batch runner:
      - loops over cities × scenarios × severities
      - runs each combo multiple times
      - saves a single CSV for analysis.
    """
    if cities is None:
        cities = DEFAULT_CITIES
    if scenarios is None:
        scenarios = SCENARIOS
    if severities is None:
        severities = [0.05, 0.1, 0.2, 0.3, 0.4]

    dfs: List[pd.DataFrame] = []

    for city in cities:
        for scenario in scenarios:
            for sev in severities:
                df = run_single_scenario_for_city(
                    city=city,
                    scenario=scenario,
                    severity=sev,
                    n_pairs=n_pairs,
                    runs=runs_per_severity,
                    seed=seed,
                )
                dfs.append(df)

    if not dfs:
        print("No data generated.")
        return

    df_all = pd.concat(dfs, ignore_index=True)
    os.makedirs(os.path.dirname(output_csv) or ".", exist_ok=True)
    df_all.to_csv(output_csv, index=False)
    print(f"Saved results to {output_csv}")


if __name__ == "__main__":
    run_experiments()