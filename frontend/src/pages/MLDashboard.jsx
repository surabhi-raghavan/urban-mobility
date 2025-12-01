import { useState } from "react";
import axios from "axios";

export default function MLDashboard() {
  const [city, setCity] = useState("");
  const [failureType, setFailureType] = useState("Bridge Collapse");
  const [intensity, setIntensity] = useState(40);

  const [result, setResult] = useState(null);
  const [scenarioExp, setScenarioExp] = useState(null);
  const [structuralExp, setStructuralExp] = useState([]);
  const [loading, setLoading] = useState(false);

  const FAILURE_OPTIONS = [
    "Bridge Collapse",
    "Tunnel Closure",
    "Highway Flood",
    "Targeted Attack",
    "Random failures",
  ];

  const predict = async () => {
    if (!city.trim()) {
      alert("Please enter a city name.");
      return;
    }

    setLoading(true);
    setResult(null);
    setScenarioExp(null);
    setStructuralExp([]);

    try {
      const res = await axios.post("http://127.0.0.1:8000/ml/predict-city", {
        city: city.trim(),
        failure_type: failureType,
        intensity: Number(intensity),
      });

      const data = res.data;
      console.log("Backend:", data);

      setResult(data.resilience);
      setScenarioExp(data.explanation.scenario);
      setStructuralExp(data.explanation.structural);
    } catch (err) {
      console.error("Prediction error:", err);
      alert("Prediction failed. Check backend logs.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h2>ML Resilience Prediction</h2>

      {/* City input */}
      <div style={{ marginTop: "1.2rem" }}>
        <label>
          <strong>City:</strong>
        </label>
        <input
          type="text"
          value={city}
          placeholder="Boston, MA"
          onChange={(e) => setCity(e.target.value)}
          style={{ marginLeft: 10, width: 250, padding: 6 }}
        />
      </div>

      {/* Failure Type */}
      <div style={{ marginTop: "1rem" }}>
        <label>
          <strong>Failure Type:</strong>
        </label>
        <select
          value={failureType}
          onChange={(e) => setFailureType(e.target.value)}
          style={{ marginLeft: 10, padding: 6 }}
        >
          {FAILURE_OPTIONS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Intensity */}
      <div style={{ marginTop: "1rem" }}>
        <label>
          <strong>Intensity (0–100):</strong>
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          style={{ marginLeft: 10, width: 80, padding: 6 }}
        />
      </div>

      {/* Button */}
      <button
        onClick={predict}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "#4c8bfd",
          color: "white",
          borderRadius: 6,
          border: "none",
        }}
      >
        {loading ? "Predicting…" : "Predict"}
      </button>

      {/* Prediction Result */}
      {result !== null && (
        <div
          style={{
            marginTop: 25,
            padding: 15,
            background: "#e7ffe7",
            borderRadius: 6,
          }}
        >
          <h3>Predicted Resilience</h3>
          <p style={{ fontSize: "1.3rem" }}>
            <strong>{result.toFixed(4)}</strong>
          </p>
        </div>
      )}

      {/* Explanation */}
      {scenarioExp && (
        <div
          style={{
            marginTop: 25,
            padding: 15,
            background: "#f4f4ff",
            borderRadius: 6,
          }}
        >
          <h3>Why this score?</h3>

          {/* Scenario Explanation */}
          <p style={{ marginTop: 10 }}>
            Under the <strong>{scenarioExp.name}</strong> scenario, resilience
            changed by <strong>{scenarioExp.effect.toFixed(4)}</strong> relative
            to a typical city in the dataset.
          </p>

          {/* Structural Explanations */}
          <h4 style={{ marginTop: 15 }}>Key Structural Factors</h4>
          <ul>
            {structuralExp.map((item, i) => (
              <li key={i}>
                <strong>{item.feature.replace("feat_", "")}</strong>:{" "}
                {item.effect > 0 ? "+" : ""}
                {item.effect.toFixed(4)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
