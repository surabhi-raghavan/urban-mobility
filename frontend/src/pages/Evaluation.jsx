import { useEffect, useState } from "react";
import {
  getMLMetrics,
  getFeatureImportances,
  getScenarioMAE,
  getPredictions,
  API_BASE,
} from "../api/client";
import SummaryCard from "../components/cards/SummaryCard";
import { Bar, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);
export default function Evaluation() {
  const [metrics, setMetrics] = useState(null);
  const [importances, setImportances] = useState([]);
  const [scenarioMAE, setScenarioMAE] = useState([]);
  const [preds, setPreds] = useState([]);

  useEffect(() => {
    console.log("📡 Evaluation Mounted. Fetching ML Metrics…");

    getMLMetrics()
      .then((m) => {
        console.log("✅ Metrics loaded:", m);
        setMetrics(m);
      })
      .catch((err) => console.error("❌ Metrics fetch FAILED:", err));

    console.log("📡 Fetching Feature Importances…");
    getFeatureImportances()
      .then((data) => {
        console.log("✅ Feature Importances:", data);
        setImportances(data);
      })
      .catch((err) =>
        console.error("❌ Feature Importances fetch FAILED:", err)
      );

    console.log("📡 Fetching Scenario-wise MAE…");
    getScenarioMAE()
      .then((data) => {
        console.log("✅ Scenario MAE:", data);
        setScenarioMAE(data);
      })
      .catch((err) => console.error("❌ Scenario MAE fetch FAILED:", err));

    console.log("📡 Fetching Predictions…");
    getPredictions()
      .then((data) => {
        console.log("✅ Predictions:", data.slice(0, 5), "…");
        setPreds(data);
      })
      .catch((err) => console.error("❌ Predictions fetch FAILED:", err));
  }, []);

  // ---------- LOG WHEN METRICS IS NULL ----------
  if (!metrics) {
    console.log(
      "⏳ Waiting for metrics to load… metrics is currently:",
      metrics
    );
    return <p style={{ padding: "2rem" }}>Loading…</p>;
  }

  console.log("🎉 Rendering Evaluation Dashboard!");

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Model Evaluation Dashboard</h2>

      {/* ---------- IMAGES ---------- */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Generated Evaluation Graphics</h3>

        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            "feature_importances.png",
            "pred_vs_actual.png",
            "residual_distribution.png",
            "scenario_wise_mae.png",
            "severity_vs_error.png",
          ].map((img) => (
            <img
              key={img}
              src={`${API_BASE}/ml/eval/image/${img}`}
              alt={img}
              style={{ width: "100%", borderRadius: "10px" }}
              onError={(e) => {
                console.error("❌ Failed to load image:", img);
                e.target.style.display = "none";
              }}
              onLoad={() => console.log("🖼️ Loaded image:", img)}
            />
          ))}
        </div>
      </div>

      {/* ---------- METRICS ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        <SummaryCard title="R² Score" value={metrics.R2.toFixed(3)} />
        <SummaryCard title="MAE" value={metrics.MAE.toFixed(3)} />
        <SummaryCard title="RMSE" value={metrics.RMSE.toFixed(4)} />
        <SummaryCard title="MAPE (%)" value={metrics["MAPE (%)"].toFixed(2)} />
      </div>

      {/* ---------- CHARTS ---------- */}
      <div style={{ marginTop: "2rem" }}>
        <h3>Feature Importances (Top 15)</h3>
        <Bar
          data={{
            labels: importances.map((r) => r.feature),
            datasets: [
              {
                label: "Importance",
                data: importances.map((r) => r.importance),
              },
            ],
          }}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Predicted vs Actual</h3>
        <Scatter
          data={{
            datasets: [
              {
                label: "Predictions",
                data: preds.map((p) => ({
                  x: p.label_resilience_score,
                  y: p.prediction,
                })),
              },
            ],
          }}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Residual Errors</h3>
        <Bar
          data={{
            labels: preds.map((_, i) => i),
            datasets: [
              {
                label: "Residual",
                data: preds.map((p) => p.error),
              },
            ],
          }}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Scenario-wise MAE</h3>
        <Bar
          data={{
            labels: scenarioMAE.map((s) => s.scenario),
            datasets: [
              {
                label: "MAE",
                data: scenarioMAE.map((s) => s.MAE),
              },
            ],
          }}
        />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Error vs Severity</h3>
        <Scatter
          data={{
            datasets: [
              {
                label: "Error",
                data: preds.map((p) => ({
                  x: p.severity,
                  y: Math.abs(p.error),
                })),
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
