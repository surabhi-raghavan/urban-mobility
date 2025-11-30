# backend/urban_resilience/generate_maps.py

from __future__ import annotations

from pathlib import Path

import osmnx as ox
import matplotlib.pyplot as plt

from backend.urban_resilience.config import DEFAULT_CITIES, SCENARIOS, SEVERITIES
from backend.urban_resilience.experiments import (
    load_city_graph,
    select_edges_for_scenario,
)


def _clean_label(text: str) -> str:
    return (
        text.replace(",", "")
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("%", "")
    )


def save_baseline_map(G, city: str, image_dir: Path) -> None:
    """
    Save ONE baseline map for the given city.
    """
    city_clean = _clean_label(city)
    city_dir = image_dir / city_clean
    city_dir.mkdir(parents=True, exist_ok=True)

    fig, ax = ox.plot_graph(
        G,
        bgcolor="white",
        node_size=0,        # turn off nodes
        node_color=None,
        edge_color="#939393",
        edge_linewidth=0.2,  # hairline roads
        show=False,
        close=False,
    )

    # Slightly larger figure so lines don't get too dense
    fig.set_size_inches(10, 14)

    out_path = city_dir / "baseline.png"
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"[BASELINE] Saved {out_path}")


def save_scenario_map(
    G,
    city: str,
    scenario: str,
    severity: float,
    edge_ids,
    image_dir: Path,
) -> None:
    """
    Save ONE map for a given (city, scenario, severity)
    with removed edges highlighted in red.
    """
    city_clean = _clean_label(city)
    scenario_clean = _clean_label(scenario)
    sev_clean = str(severity).replace(".", "")

    city_dir = image_dir / city_clean
    city_dir.mkdir(parents=True, exist_ok=True)

    # Normalize removed edges into a set of (u, v) pairs
    removed_set = set()
    for e in edge_ids:
        # e might be (u, v, key) or (u, v)
        if len(e) >= 2:
            removed_set.add((e[0], e[1]))

    edge_colors = []
    edge_widths = []

    # Build per-edge styling
    for u, v, k in G.edges(keys=True):
        if (u, v) in removed_set or (v, u) in removed_set:
            edge_colors.append("#FF0000")  # bright red for disrupted edges
            edge_widths.append(2.8)        # thicker
        else:
            edge_colors.append("#A9A8A8")  # faint grey for backdrop
            edge_widths.append(0.2)        # hairline

    fig, ax = ox.plot_graph(
        G,
        bgcolor="white",
        node_size=0,
        node_color=None,
        edge_color=edge_colors,
        edge_linewidth=edge_widths,
        show=False,
        close=False,
    )

    fig.set_size_inches(10, 14)

    out_name = f"{scenario_clean}_sev_{sev_clean}.png"
    out_path = city_dir / out_name
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"[SCENARIO] Saved {out_path}")


def generate_all_maps(image_root: str = "data/maps") -> None:
    """
    For each city:
      - Save ONE baseline image.
      - For each (scenario, severity), save ONE scenario image.
    """
    image_dir = Path(image_root)
    image_dir.mkdir(parents=True, exist_ok=True)

    total_jobs = len(DEFAULT_CITIES) * len(SCENARIOS) * len(SEVERITIES)
    job_idx = 0

    for city in DEFAULT_CITIES:
        print(f"\n=== City: {city} ===")
        G = load_city_graph(city, cache_dir="graphs")

        # 1) baseline
        save_baseline_map(G, city, image_dir)

        # 2) scenarios × severities
        for scenario in SCENARIOS:
            for severity in SEVERITIES:
                job_idx += 1
                print(
                    f"[{job_idx}/{total_jobs}] {city} | {scenario} | severity={severity}"
                )

                # deterministic seed per (city, scenario, severity)
                seed = abs(hash((city, scenario, severity))) % (10**9)

                edge_ids = select_edges_for_scenario(
                    G,
                    scenario=scenario,
                    severity=severity,
                    seed=seed,
                )

                save_scenario_map(
                    G,
                    city=city,
                    scenario=scenario,
                    severity=severity,
                    edge_ids=edge_ids,
                    image_dir=image_dir,
                )


def main() -> None:
    generate_all_maps()


if __name__ == "__main__":
    main()