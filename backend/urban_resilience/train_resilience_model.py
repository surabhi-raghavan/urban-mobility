# backend/urban_resilience/train_resilience_model.py

from __future__ import annotations

import os
from typing import List

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error


DATA_PATH = "data/resilience_dataset.csv"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "resilience_rf.pkl")
FEAT_IMPORTANCES_PATH = os.path.join(MODEL_DIR, "feature_importances.csv")
META_PATH = os.path.join(MODEL_DIR, "resilience_rf_meta.joblib")   # NEW


def load_dataset(path: str = DATA_PATH) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}. Run build_ml_dataset first.")
    df = pd.read_csv(path)
    return df


def prepare_features(df: pd.DataFrame):
    """
    Build X, y for ML.

    - y = label_resilience_score
    - X = all feat_* + severity + scenario (one-hot)
    """
    df = df.copy()

    # Drop rows without label
    df = df[~df["label_resilience_score"].isna()].reset_index(drop=True)

    # Target
    y = df["label_resilience_score"].values

    # Base numeric features: all feat_* columns
    feat_cols = [c for c in df.columns if c.startswith("feat_")]

    # Include severity
    feat_cols.append("severity")

    # One-hot encode scenario
    df_scn = pd.get_dummies(df["scenario"], prefix="scenario")
    X_numeric = df[feat_cols]
    X = pd.concat([X_numeric, df_scn], axis=1)

    feature_names: List[str] = list(X.columns)
    X_values = X.values

    return X_values, y, feature_names, df, df_scn.columns.tolist()


def train_and_evaluate():
    df = load_dataset()
    X, y, feature_names, df_full, scenario_onehot_cols = prepare_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=None,
        random_state=42,
        n_jobs=-1,
    )

    print("Training RandomForestRegressor...")
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    print("\n=== Evaluation ===")
    print(f"R^2:  {r2:.3f}")
    print(f"MAE:  {mae:.4f}\n")

    # Save model
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")

    # Save feature importances
    importances = model.feature_importances_
    fi_df = pd.DataFrame(
        {
            "feature": feature_names,
            "importance": importances,
        }
    ).sort_values("importance", ascending=False)

    fi_df.to_csv(FEAT_IMPORTANCES_PATH, index=False)
    print(f"Saved feature importances to {FEAT_IMPORTANCES_PATH}")

    # 🔥 NEW: save metadata so inference knows feature order + scenario names
    meta = {
        "feature_names": feature_names,
        "scenario_onehot_cols": scenario_onehot_cols,
    }
    joblib.dump(meta, META_PATH)
    print(f"Saved meta to {META_PATH}")

    print("\nTop 10 important features:")
    print(fi_df.head(10))


if __name__ == "__main__":
    train_and_evaluate()
