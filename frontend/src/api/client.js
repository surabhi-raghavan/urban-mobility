export const API_BASE = "http://127.0.0.1:8000";

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
  return await res.json();
}
