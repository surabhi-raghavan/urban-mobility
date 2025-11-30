# backend/urban_resilience/ml_service.py

from __future__ import annotations

from typing import Dict, Any, List

import os

import joblib
import numpy as np
import pandas as pd

from .ml_features import compute_city_features
from .graph_loader import load_city_graph
from .train_resilience_model import load_dataset, prepare_features

# Paths must match what you used in train_resilience_model.py
DATA_PATH = "data/resilience_dataset.csv"
MODEL_PATH = "models/resilience_rf.pkl"
FEATURE_IMPORTANCES_PATH = "models/feature_importances.csv"


class MLNotReadyError(RuntimeError):
    """Raised when the ML artifacts are missing (model / data / importances)."""
    pass


# ---------- Load model + feature schema at import time ----------

def _load_model_and_schema():
    if not os.path.exists(MODEL_PATH):
        raise MLNotReadyError(
            f"Trained model not found at {MODEL_PATH}. "
            "Run `python -m urban_resilience.train_resilience_model` first."
        )
    if not os.path.exists(DATA_PATH):
        raise MLNotReadyError(
            f"Training dataset not found at {DATA_PATH}. "
            "Run `python -m urban_resilience.build_ml_dataset` first."
        )

    df = load_dataset(DATA_PATH)
    X, y, feature_names, df_full = prepare_features(df)

    model = joblib.load(MODEL_PATH)

    # Scenario names from training (raw labels)
    scenario_names = sorted(df_full["scenario"].unique())
    scenario_dummy_cols = [c for c in feature_names if c.startswith("scenario_")]

    return model, feature_names, scenario_names, scenario_dummy_cols


try:
    MODEL, FEATURE_NAMES, SCENARIO_NAMES, SCENARIO_DUMMY_COLS = _load_model_and_schema()
except MLNotReadyError:
    # Allow API import even if ML not ready; endpoints will raise on use.
    MODEL = None
    FEATURE_NAMES = []
    SCENARIO_NAMES = []
    SCENARIO_DUMMY_COLS = []


# ---------- Public helpers ----------

def ml_is_ready() -> bool:
    return MODEL is not None and len(FEATURE_NAMES) > 0


def get_feature_importances() -> List[Dict[str, Any]]:
    """
    Return feature importances as list of {feature, importance} dicts.
    Reads models/feature_importances.csv.
    """
    if not os.path.exists(FEATURE_IMPORTANCES_PATH):
        raise MLNotReadyError(
            f"Feature importances file not found at {FEATURE_IMPORTANCES_PATH}. "
            "Run `python -m urban_resilience.train_resilience_model` first."
        )

    df = pd.read_csv(FEATURE_IMPORTANCES_PATH)
    # ensure correct columns
    if "feature" not in df.columns or "importance" not in df.columns:
        raise RuntimeError("feature_importances.csv missing required columns.")

    records = df.to_dict(orient="records")
    return records


def get_city_features(city: str) -> Dict[str, float]:
    """
    Compute structural features for a given city, in the same 'feat_*' naming scheme.
    """
    G = load_city_graph(city, cache_dir="graphs")
    base_feats = compute_city_features(G)  # keys like avg_clustering, modularity, etc.

    # convert to feat_* namespace used in training dataset
    out: Dict[str, float] = {}
    for name in FEATURE_NAMES:
        if name.startswith("feat_"):
            raw_key = name[len("feat_"):]
            val = base_feats.get(raw_key, 0.0)
            out[name] = float(val)
    return out


def _build_feature_vector_for_prediction(
    city: str,
    scenario: str,
    severity: float,
) -> np.ndarray:
    """
    Build a 1D numpy array of features in the exact order FEATURE_NAMES,
    for the given (city, scenario, severity).
    """
    if not ml_is_ready():
        raise MLNotReadyError(
            "ML model not loaded. Train the model and restart the backend."
        )

    if scenario not in SCENARIO_NAMES:
        raise ValueError(
            f"Scenario '{scenario}' not seen during training. "
            f"Valid: {SCENARIO_NAMES}"
        )

    # Load city graph + compute base structural features (non-prefixed keys)
    G = load_city_graph(city, cache_dir="graphs")
    base_feats = compute_city_features(G)  # e.g., avg_clustering, modularity, ...

    # Now map them into the FEATURE_NAMES vector
    row: Dict[str, float] = {}

    for fname in FEATURE_NAMES:
        if fname.startswith("feat_"):
            raw_key = fname[len("feat_"):]
            row[fname] = float(base_feats.get(raw_key, 0.0))
        elif fname == "severity":
            row[fname] = float(severity)
        elif fname.startswith("scenario_"):
            scen_label = fname[len("scenario_"):]
            row[fname] = 1.0 if scen_label == scenario else 0.0
        else:
            # any unexpected column -> set to 0
            row[fname] = 0.0

    # Build vector in exact order
    x = np.array([row[fname] for fname in FEATURE_NAMES], dtype=float)
    return x


def predict_resilience_for_city_scenario(
    city: str,
    scenario: str,
    severity: float,
) -> float:
    """
    Predict a scalar resilience score (higher = more resilient) for a given
    city + disruption scenario + severity, using the trained RandomForest model.
    """
    if not ml_is_ready():
        raise MLNotReadyError(
            "ML model not loaded. Train the model and restart the backend."
        )

    x = _build_feature_vector_for_prediction(city, scenario, severity)
    pred = float(MODEL.predict(x.reshape(1, -1))[0])
    return pred