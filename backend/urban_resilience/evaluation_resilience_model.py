# backend/urban_resilience/evaluation_resilience_model.py

from __future__ import annotations
import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error,
    explained_variance_score,
)

from urban_resilience.train_resilience_model import load_dataset, prepare_features, MODEL_PATH

OUTPUT_DIR = "evaluation_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ---------------------------------------------------------
# Utility
# ---------------------------------------------------------

def rmse(y, pred):
    return mean_squared_error(y, pred)

def mape(y, pred):
    y, pred = np.array(y), np.array(pred)
    return np.mean(np.abs((y - pred) / np.maximum(1e-6, y))) * 100


# ---------------------------------------------------------
# Load model + data
# ---------------------------------------------------------

def load_everything():
    print("Loading dataset…")
    df = load_dataset()

    print("Preparing features…")
    X, y, feature_names, df_full = prepare_features(df)

    print("Loading model…")
    model = joblib.load(MODEL_PATH)

    return df, X, y, model, feature_names, df_full


# ---------------------------------------------------------
# Evaluation
# ---------------------------------------------------------

def evaluate_model():
    df, X, y, model, feature_names, df_full = load_everything()

    print("\nGenerating predictions…")
    preds = model.predict(X)

    # Metrics
    metrics = {
        "R2": r2_score(y, preds),
        "MAE": mean_absolute_error(y, preds),
        "RMSE": rmse(y, preds),
        "MAPE (%)": mape(y, preds),
        "Explained Variance": explained_variance_score(y, preds),
    }

    print("\n=== GLOBAL EVALUATION METRICS ===")
    for k, v in metrics.items():
        print(f"{k:20s} : {v:.4f}")

    # Save metrics to file
    pd.DataFrame([metrics]).to_csv(f"{OUTPUT_DIR}/metrics_summary.csv", index=False)


    # ---------------------------------------------------------
    # Attach predictions to dataframe
    # ---------------------------------------------------------
    df_eval = df_full.copy()
    df_eval["prediction"] = preds
    df_eval["error"] = preds - df_eval["label_resilience_score"]
    df_eval["abs_error"] = np.abs(df_eval["error"])

    df_eval.to_csv(f"{OUTPUT_DIR}/model_predictions.csv", index=False)
    print(f"Saved predictions to {OUTPUT_DIR}/model_predictions.csv")


    # ---------------------------------------------------------
    # Plot 1: Predicted vs Actual
    # ---------------------------------------------------------
    plt.figure(figsize=(6, 6))
    plt.scatter(df_eval["label_resilience_score"], preds, alpha=0.4)
    plt.xlabel("Actual Resilience Score")
    plt.ylabel("Predicted Resilience Score")
    plt.title("Predicted vs Actual")
    plt.plot([0, max(y)], [0, max(y)], "--", color="red")
    plt.grid(True)
    plt.savefig(f"{OUTPUT_DIR}/pred_vs_actual.png")
    plt.close()


    # ---------------------------------------------------------
    # Plot 2: Residual Distribution
    # ---------------------------------------------------------
    plt.figure(figsize=(6, 4))
    plt.hist(df_eval["error"], bins=40, alpha=0.7)
    plt.title("Residual Distribution")
    plt.xlabel("Prediction Error")
    plt.ylabel("Frequency")
    plt.grid(True)
    plt.savefig(f"{OUTPUT_DIR}/residual_distribution.png")
    plt.close()


    # ---------------------------------------------------------
    # Scenario-wise performance
    # ---------------------------------------------------------
    scenario_scores = (
        df_eval.groupby("scenario")
        .apply(lambda g: mean_absolute_error(g["label_resilience_score"], g["prediction"]))
        .reset_index()
        .rename(columns={0: "MAE"})
    )

    scenario_scores.to_csv(f"{OUTPUT_DIR}/scenario_wise_mae.csv", index=False)

    plt.figure(figsize=(8, 4))
    plt.bar(scenario_scores["scenario"], scenario_scores["MAE"])
    plt.xticks(rotation=45, ha="right")
    plt.title("Scenario-wise MAE")
    plt.savefig(f"{OUTPUT_DIR}/scenario_wise_mae.png")
    plt.close()


    # ---------------------------------------------------------
    # Severity vs Error
    # ---------------------------------------------------------
    plt.figure(figsize=(6, 4))
    plt.scatter(df_eval["severity"], df_eval["abs_error"], alpha=0.3)
    plt.xlabel("Severity")
    plt.ylabel("Absolute Error")
    plt.title("Error vs Severity")
    plt.grid(True)
    plt.savefig(f"{OUTPUT_DIR}/severity_vs_error.png")
    plt.close()


    # ---------------------------------------------------------
    # Worst 10 and best 10 predictions
    # ---------------------------------------------------------
    best10 = df_eval.sort_values("abs_error").head(10)
    worst10 = df_eval.sort_values("abs_error").tail(10)

    best10.to_csv(f"{OUTPUT_DIR}/best10_predictions.csv", index=False)
    worst10.to_csv(f"{OUTPUT_DIR}/worst10_predictions.csv", index=False)


    # ---------------------------------------------------------
    # Feature importances plot
    # ---------------------------------------------------------
    importances = model.feature_importances_

    fi_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances
    }).sort_values("importance", ascending=False)

    plt.figure(figsize=(8, 6))
    plt.barh(fi_df["feature"][:15], fi_df["importance"][:15])
    plt.title("Top 15 Feature Importances")
    plt.gca().invert_yaxis()
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/feature_importances.png")
    plt.close()

    print("\nAll evaluation outputs saved under:", OUTPUT_DIR)


if __name__ == "__main__":
    evaluate_model()