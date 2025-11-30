# backend/urban_resilience/config.py

DEFAULT_CITIES = [
    "Chicago, Illinois, USA",
    "Pittsburgh, Pennsylvania, USA",
    "Dallas, Texas, USA",
    "Phoenix, Arizona, USA",
    "San Francisco, California, USA",
]

SCENARIOS = [
    "Bridge Collapse",
    "Tunnel Closure",
    "Highway Flood",
    "Targeted Attack (Top k%)",
    "Random Failure",
]

SEVERITIES = [0.3, 0.5, 0.7]  # ~30%, 50%, 70% disruption
N_PAIRS_PER_RUN = 30          # OD pairs per run for richer stats
RUNS_PER_SETTING = 5          # how many times to repeat each config
