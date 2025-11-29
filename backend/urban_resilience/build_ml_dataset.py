# backend/urban_resilience/build_ml_dataset.py

from __future__ import annotations

import os
from typing import List, Dict, Any

import pandas as pd

from .config import DEFAULT_CITIES, SCENARIOS
from .graph_loader import load_city_graph
from .edge_selection import select_edges_for_scenario
from .simulation import simulate_single_shock
from .usgs_flood import download_usgs_flood_features_for_city
from .ml_features import compute_city_features

# You said: Chicago, Pittsburgh, Dallas, Phoenix, San Francisco
# Make sure these names match what you pass to OSMnx in config or manually define.
REPORT_CITIES = [
    "Chicago, Illinois, USA",
    "Pittsburgh, Pennsylvania, USA",
    "Dallas, Texas, USA",
    "Phoenix, Arizona, USA",
    "San Francisco, California, USA",
]

# Choose a subset of scenarios (they should match your SCENARIOS list)
SCENARIOS_FOR_ML = [
    "Bridge Collapse",
    "Tunnel Closure",
    "Highway Flood",
    "Targeted Attack (Top k%)",
    "Random Failure",
]

# Choose a small grid of severities (mapped upstream to fraction of edges)
SEVERITIES = [0.05, 0.1, 0.2, 0.3]  # light -> heavy disruptions

N_OD_PAIRS = 60  # more than UI default, to stabilize metrics


def build_dataset(output_path: str = "data/resilience_dataset.csv") -> None:
    """
    Build a tabular dataset across cities × scenarios × severities.

    Each row: city, scenario, severity, structural features, resilience metrics.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    rows: List[Dict[str, Any]] = []

    for city in REPORT_CITIES:
        print(f"\n=== Processing city: {city} ===")
        G = load_city_graph(city, cache_dir="graphs")

        # Compute structural features once per city
        base_feats = compute_city_features(G)

        for scenario in SCENARIOS_FOR_ML:
            print(f"  Scenario: {scenario}")

            # optional USGS flood data
            use_usgs = scenario == "Highway Flood"

            flood_polys = None
            if use_usgs:
                try:
                    flood_polys = download_usgs_flood_features_for_city(city)
                except Exception as e:
                    print(f"    [WARN] Failed to download USGS flood data: {e}")
                    flood_polys = None

            for sev in SEVERITIES:
                print(f"    Severity: {sev:.2f}")

                # 1) Select edges
                try:
                    edge_ids = select_edges_for_scenario(
                        G,
                        scenario=scenario,
                        severity=sev,
                        usgs_flood_polygons=flood_polys,
                        seed=42,
                    )
                except Exception as e:
                    print(f"    [ERROR] edge selection failed: {e}")
                    continue

                # 2) Run simulation
                try:
                    metrics = simulate_single_shock(
                        G,
                        edge_ids_to_remove=edge_ids,
                        n_pairs=N_OD_PAIRS,
                        seed=123,
                    )
                except Exception as e:
                    print(f"    [ERROR] simulation failed: {e}")
                    continue

                # 3) Combine into one row
                row: Dict[str, Any] = {
                    "city": city,
                    "scenario": scenario,
                    "severity": float(sev),
                }
                # structural features (prefix: feat_)
                for k, v in base_feats.items():
                    row[f"feat_{k}"] = v

                # simulation metrics (prefix: met_)
                for k, v in metrics.items():
                    row[f"met_{k}"] = v

                # derived resilience score: higher is better
                # avg_ratio ~ (new_travel_time / baseline_travel_time)
                # So resilience ≈ 1 / avg_ratio
                avg_ratio = metrics.get("avg_ratio", None)
                if avg_ratio is not None and avg_ratio > 0:
                    row["label_resilience_score"] = float(1.0 / avg_ratio)
                else:
                    row["label_resilience_score"] = None

                rows.append(row)

    df = pd.DataFrame(rows)
    print(f"\nSaving dataset with {len(df)} rows to: {output_path}")
    df.to_csv(output_path, index=False)
    print("Done.")


if __name__ == "__main__":
    build_dataset()
