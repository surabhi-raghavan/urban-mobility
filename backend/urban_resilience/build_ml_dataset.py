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

REPORT_CITIES = [
    "Chicago, Illinois, USA",
    "Pittsburgh, Pennsylvania, USA",
    "Dallas, Texas, USA",
    "Phoenix, Arizona, USA",
    "San Francisco, California, USA",
]

SCENARIOS_FOR_ML = [
    "Bridge Collapse",
    "Tunnel Closure",
    "Highway Flood",
    "Targeted Attack (Top k%)",
    "Random Failure",
]

SEVERITIES = [0.05, 0.1, 0.2, 0.3]

N_OD_PAIRS = 60


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

        base_feats = compute_city_features(G)

        for scenario in SCENARIOS_FOR_ML:
            print(f"  Scenario: {scenario}")

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

                row: Dict[str, Any] = {
                    "city": city,
                    "scenario": scenario,
                    "severity": float(sev),
                }
                for k, v in base_feats.items():
                    row[f"feat_{k}"] = v

                for k, v in metrics.items():
                    row[f"met_{k}"] = v

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
