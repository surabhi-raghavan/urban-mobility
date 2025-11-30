# backend/urban_resilience/resilience_stats.py

from __future__ import annotations
from typing import Dict, Any
import pandas as pd

DATA_PATH = "data/resilience_dataset.csv"

def compute_city_resilience_summary() -> Dict[str, Any]:
    """
    Computes:
      • avg resilience score per city
      • avg shock severity impact
      • avg travel-time ratio
      • scenarios with worst performance
    Returns a dictionary keyed by city.
    """
    df = pd.read_csv(DATA_PATH)

    # Clean rows
    df = df[~df["label_resilience_score"].isna()].copy()

    summary = {}

    for city, g in df.groupby("city"):
        avg_resilience = g["label_resilience_score"].mean()
        avg_ratio = g["met_avg_ratio"].mean()
        avg_severity = g["severity"].mean()

        # Which scenario makes the city least resilient?
        scen_stats = (
            g.groupby("scenario")["label_resilience_score"]
            .mean()
            .sort_values()
        )
        worst_scenario = scen_stats.index[0]
        worst_scenario_score = scen_stats.iloc[0]

        summary[city] = {
            "city": city,
            "avg_resilience": float(avg_resilience),
            "avg_ratio": float(avg_ratio),
            "avg_severity": float(avg_severity),
            "worst_scenario": worst_scenario,
            "worst_scenario_score": float(worst_scenario_score),
        }

    return summary