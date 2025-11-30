# backend/urban_resilience/experiments.py

from __future__ import annotations
from typing import List, Optional

import numpy as np
import pandas as pd

from .graph_loader import load_city_graph
from .edge_selection import select_edges_for_scenario
from .simulation import simulate_single_shock


def run_single_scenario_for_city(
    city: str,
    scenario: str,
    severity: float,
    n_pairs: int = 20,
    runs: int = 3,
    seed: Optional[int] = None,
) -> pd.DataFrame:
    """
    Run the same scenario & severity multiple times for one city.
    Returns a DataFrame with one row per run.
    """
    G = load_city_graph(city, cache_dir="graphs")
    rng = np.random.default_rng(seed)

    rows: List[dict] = []
    for run in range(runs):
        run_seed = int(rng.integers(0, 1_000_000_000))

        edge_ids = select_edges_for_scenario(
            G,
            scenario=scenario,
            severity=severity,
            seed=run_seed,
        )
        metrics = simulate_single_shock(
            G,
            edge_ids_to_remove=edge_ids,
            n_pairs=n_pairs,
            seed=run_seed,
        )

        row = {
            "city": city,
            "scenario": scenario,
            "severity": severity,
            "run": run,
            **metrics,
        }
        rows.append(row)

    return pd.DataFrame(rows)