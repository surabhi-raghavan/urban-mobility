// src/components/ml/ResiliencePredictionBox.jsx
import { useState } from "react";
import { predictResilience } from "../../api/client";

export default function ResiliencePredictionBox({ city }) {
  const [scenario, setScenario] = useState("Random Failure");
  const [severity, setSeverity] = useState(0.1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = async () => {
    if (!city) return alert("Pick a city first");

    setLoading(true);

    try {
      const r = await predictResilience({
        city,
        scenario,
        severity,
      });
      setResult(r.resilience_score);
    } catch (err) {
      alert("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        padding: "1rem",
        borderRadius: "1rem",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Resilience Predictor</h3>

      <label style={{ fontSize: "0.85rem" }}>Scenario</label>
      <select
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <option>Random Failure</option>
        <option>Targeted Attack (Top k%)</option>
        <option>Bridge Collapse</option>
        <option>Tunnel Closure</option>
        <option>Highway Flood</option>
      </select>

      <label style={{ fontSize: "0.85rem" }}>Severity</label>
      <input
        type="range"
        min={1}
        max={50}
        value={severity * 100}
        onChange={(e) => setSeverity(Number(e.target.value) / 100)}
        style={{ width: "100%" }}
      />

      <button
        onClick={runPrediction}
        disabled={loading}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.6rem",
          borderRadius: "999px",
          background: "#4f46e5",
          color: "white",
          border: "none",
          fontWeight: 600,
        }}
      >
        {loading ? "Predicting…" : "Predict"}
      </button>

      {result != null && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#eef2ff",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Predicted Resilience: {result.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
