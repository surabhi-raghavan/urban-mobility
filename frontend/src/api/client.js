// src/api/client.js
const API_BASE = "http://127.0.0.1:8000";

export async function fetchScenarios() {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error("Failed to load scenarios");
  const data = await res.json();
  return data.scenarios || [];
}

export async function runSimulation({
  city,
  scenario,
  severity,
  nPairs,
  useUSGS,
}) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city,
      scenario,
      severity,
      n_pairs: nPairs,
      use_usgs_flood: useUSGS,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Simulation failed");
  }
  return await res.json(); // This is your SimResponse from backend
}

// === ML ENDPOINTS ===
// === ML ENDPOINTS (corrected) ===

//const API_BASE = "http://127.0.0.1:8000";

// 1. Get feature importances (global)
export async function fetchFeatureImportances() {
  const res = await fetch(`${API_BASE}/ml/importances`);
  if (!res.ok) {
    console.error(await res.text());
    throw new Error("Failed to load ML feature importances");
  }
  return await res.json(); // [{ feature, importance }]
}

// 2. Get per-city structural features
export async function fetchCityFeatures(city) {
  const res = await fetch(
    `${API_BASE}/ml/features?city=${encodeURIComponent(city)}`
  );
  if (!res.ok) {
    console.error(await res.text());
    throw new Error("Failed to load city features");
  }
  const data = await res.json();
  return data.features;
}

// 3. Predict resilience for any city + scenario
export async function predictResilience({ city, scenario, severity }) {
  const url = `${API_BASE}/ml/predict?city=${encodeURIComponent(
    city
  )}&scenario=${encodeURIComponent(scenario)}&severity=${severity}`;

  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    console.error(await res.text());
    throw new Error("Prediction error");
  }
  const data = await res.json();
  return { resilience_score: data.predicted_resilience };
}
