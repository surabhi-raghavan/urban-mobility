# backend/urban_resilience/ml_service.py

from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor  # type: ignore
import joblib

# backend/urban_resilience/ml_service.py
# BASE_DIR = backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATA_PATH = Path(
    "/Users/surabhiraghavan/Documents/Sem 3/Network Science and Analysis/urban-mobility/backend/data/resilience_dataset.csv"
)

MODEL_PATH = Path(
    "/Users/surabhiraghavan/Documents/Sem 3/Network Science and Analysis/urban-mobility/backend/models/resilience_rf.pkl"
)

SCENARIO_NAMES = [
    "Bridge Collapse",
    "Tunnel Closure",
    "Highway Flood",
    "Targeted Attack (Top k%)",
    "Random Failure",
]

_model: RandomForestRegressor | None = None
_df: pd.DataFrame | None = None
_feature_cols: List[str] | None = None
_cities: List[str] | None = None


def _load_df() -> pd.DataFrame:
    global _df, _feature_cols, _cities
    if _df is None:
        if not DATA_PATH.exists():
            raise RuntimeError(f"Dataset not found at {DATA_PATH}")
        df = pd.read_csv(DATA_PATH)
        # Normalize column names if needed
        df.columns = [c.strip() for c in df.columns]

        # Feature columns: everything except city, scenario, label
        excluded = {"city", "scenario", "label_resilience_score"}
        feature_cols = [c for c in df.columns if c not in excluded]

        _df = df
        _feature_cols = feature_cols
        _cities = sorted(df["city"].unique().tolist())
    return _df


def _load_model() -> RandomForestRegressor:
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model


def ml_is_ready() -> bool:
    try:
        _load_df()
        _load_model()
        return True
    except Exception:
        return False


def get_scenario_names() -> List[str]:
    return SCENARIO_NAMES


def get_cities() -> List[str]:
    _load_df()
    return _cities or []


def _ensure_loaded() -> Tuple[pd.DataFrame, RandomForestRegressor, List[str]]:
    df = _load_df()
    model = _load_model()
    if _feature_cols is None:
        raise RuntimeError("Feature columns not initialized.")
    return df, model, _feature_cols


def get_feature_importances() -> List[Dict[str, Any]]:
    """
    Return global feature importances from the RandomForest model.
    """
    df, model, feature_cols = _ensure_loaded()

    importances = getattr(model, "feature_importances_", None)
    if importances is None:
        # Fallback: equal importance
        importances = np.ones(len(feature_cols)) / len(feature_cols)

    items = [
        {"feature": f, "importance": float(imp)}
        for f, imp in zip(feature_cols, importances)
    ]
    # Sort descending
    items.sort(key=lambda x: x["importance"], reverse=True)
    return items


def get_city_features(city: str) -> Dict[str, Any]:
    """
    Return structural features for a given city.
    We simply take the first row for that city (features are constant across rows).
    """
    df, model, feature_cols = _ensure_loaded()
    sub = df[df["city"] == city]
    if sub.empty:
        raise ValueError(f"No rows found for city: {city}")

    row = sub.iloc[0]
    features = {f: float(row[f]) for f in feature_cols if f.startswith("feat_")}
    return {
        "city": city,
        "features": features,
    }


def _pick_row_for_city_scenario_severity(
    city: str, scenario: str, severity: float
) -> pd.Series:
    df, _, _ = _ensure_loaded()

    sub = df[(df["city"] == city) & (df["scenario"] == scenario)]
    if sub.empty:
        raise ValueError(
            f"No rows found for city='{city}' and scenario='{scenario}'."
        )

    # severities available in dataset
    sev_values = sub["severity"].values.astype(float)
    # pick nearest severity in dataset
    idx = int(np.argmin(np.abs(sev_values - severity)))
    row = sub.iloc[idx]
    return row


def predict_resilience_for_city_scenario(
    city: str, scenario: str, severity: float
) -> Dict[str, Any]:
    """
    Use the trained RF model to predict resilience for a (city, scenario, severity).
    Internally we select the nearest severity row from the small dataset and
    feed its feature vector to the model.
    """
    df, model, feature_cols = _ensure_loaded()
    row = _pick_row_for_city_scenario_severity(city, scenario, severity)

    X = row[feature_cols].values.astype(float).reshape(1, -1)
    pred = float(model.predict(X)[0])

    # also return ground-truth label for that nearest severity (for comparison)
    gt = float(row.get("label_resilience_score", np.nan))
    used_sev = float(row["severity"])

    return {
        "city": city,
        "scenario": scenario,
        "requested_severity": float(severity),
        "used_severity": used_sev,
        "predicted_resilience": pred,
        "dataset_label": gt,
    }


def predict_resilience_from_features(features: Dict[str, float]) -> float:
    """
    Optional helper: predict directly from a dict of feature_name -> value.
    Only uses columns the model knows.
    """
    _, model, feature_cols = _ensure_loaded()
    x_row = [features.get(f, 0.0) for f in feature_cols]
    X = np.array(x_row, dtype=float).reshape(1, -1)
    return float(model.predict(X)[0])


def get_all_cities_overview() -> List[Dict[str, Any]]:
    """
    Return an overview table: per-city average resilience score in the dataset.
    """
    df, _, _ = _ensure_loaded()
    if "label_resilience_score" not in df.columns:
        return []

    grouped = (
        df.groupby("city")["label_resilience_score"]
        .agg(["mean", "min", "max", "count"])
        .reset_index()
    )

    rows: List[Dict[str, Any]] = []
    for _, r in grouped.iterrows():
        rows.append(
            {
                "city": r["city"],
                "mean_resilience": float(r["mean"]),
                "min_resilience": float(r["min"]),
                "max_resilience": float(r["max"]),
                "n_samples": int(r["count"]),
            }
        )
    return rows
