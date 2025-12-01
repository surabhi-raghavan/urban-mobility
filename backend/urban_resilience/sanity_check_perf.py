# backend/urban_resilience/sanity_check_perf.py

from __future__ import annotations

import time

from backend.urban_resilience.config import (
    DEFAULT_CITIES,
    SEVERITIES,
    N_PAIRS_PER_RUN,
)
from backend.urban_resilience.graph_loader import load_city_graph
from backend.urban_resilience.edge_selection import select_edges_for_scenario
from backend.urban_resilience.experiments import run_single_scenario_for_city


def time_select_edges(G, city: str, scenario: str, severity: float) -> None:
    """
    Time just the edge selection step (no shortest paths).
    Useful to see if Targeted Attack caching is working.
    """
    print(f"\n--- Edge selection timing: {city} | {scenario} | severity={severity} ---")

    print("  [*] Running FIRST call (this may compute betweenness)...")
    t0 = time.perf_counter()
    edges1 = select_edges_for_scenario(
        G,
        scenario=scenario,
        severity=severity,
        seed=123,
    )
    t1 = time.perf_counter()
    print(f"  [OK] First call done in {t1 - t0:.4f} s, edges = {len(edges1)}")

    print("  [*] Running SECOND call (should hit cache if targeted)...")
    t2 = time.perf_counter()
    edges2 = select_edges_for_scenario(
        G,
        scenario=scenario,
        severity=severity,
        seed=456,
    )
    t3 = time.perf_counter()
    print(f"  [OK] Second call done in {t3 - t2:.4f} s, edges = {len(edges2)}")


def time_full_simulation(city: str, scenario: str, severity: float) -> None:
    """
    Time one full run_single_scenario_for_city call for a given scenario.
    """
    print(f"\n=== Full simulation timing: {city} | {scenario} | severity={severity} ===")

    print("  [*] Starting simulation run...")
    t0 = time.perf_counter()

    df = run_single_scenario_for_city(
        city=city,
        scenario=scenario,
        severity=severity,
        n_pairs=N_PAIRS_PER_RUN,
        runs=1,      # only 1 run for sanity timing
        seed=42,
    )

    t1 = time.perf_counter()
    print(f"  [OK] Simulation finished in {t1 - t0:.4f} s")

    if not df.empty:
        cols = [
            c
            for c in df.columns
            if c not in ("city", "scenario", "severity", "run")
        ]
        preview = df[cols].iloc[0].to_dict()
        print("  Sample metrics:", preview)


def main() -> None:
    # Pick first city and middle severity
    city = DEFAULT_CITIES[0]
    severity = SEVERITIES[1] if len(SEVERITIES) > 1 else SEVERITIES[0]

    print(f"Using city = {city}")
    print(f"Using severity = {severity}")

    print("\n[*] Loading city graph (this is heavy the first time)...")
    t0 = time.perf_counter()
    G = load_city_graph(city, cache_dir="graphs")
    t1 = time.perf_counter()
    print(f"[OK] Graph load time for {city}: {t1 - t0:.4f} s")

    # Edge selection tests
    time_select_edges(G, city, "Targeted Attack (Top k%)", severity)
    time_select_edges(G, city, "Random Failure", severity)

    # Full simulation tests
    time_full_simulation(city, "Targeted Attack (Top k%)", severity)
    time_full_simulation(city, "Random Failure", severity)


if __name__ == "__main__":
    main()