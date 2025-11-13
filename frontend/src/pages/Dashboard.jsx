// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import CitySelector from "../components/city/CitySelector";
import Tabs from "../components/layout/Tabs";
import Legend from "../components/Legend";
import NetworkMap from "../components/maps/NetworkMap";
import ComparisonMaps from "../components/maps/ComparisonMaps";
import { fetchScenarios, runSimulation } from "../api/client";

function Dashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState("visual");

  const [selectedCity, setSelectedCity] = useState(null);
  const [cityOverride, setCityOverride] = useState(""); // free text

  const [scenario, setScenario] = useState("");
  const [intensity, setIntensity] = useState(40); // 0-100 slider
  const [nPairs, setNPairs] = useState(40);
  const [useUSGS, setUseUSGS] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [edgesGeo, setEdgesGeo] = useState(null);
  const [removedGeo, setRemovedGeo] = useState(null);

  useEffect(() => {
    fetchScenarios()
      .then((scs) => {
        setScenarios(scs);
        if (!scenario && scs.length) setScenario(scs[0]);
      })
      .catch((e) => console.error(e));
  }, [scenario]);

  const effectiveCityString = useMemo(() => {
    if (cityOverride.trim()) return cityOverride.trim();
    if (selectedCity) return selectedCity.query;
    return "";
  }, [cityOverride, selectedCity]);

  // Map intensity 0-100 to severity 0.01-0.5
  const severity = useMemo(() => {
    const frac = intensity / 100;
    return 0.01 + frac * (0.5 - 0.01);
  }, [intensity]);

  const handleRun = async () => {
    if (!effectiveCityString) {
      alert("Select a city first.");
      return;
    }
    if (!scenario) {
      alert("Choose a disruption type.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Loading network data…");
      const res = await runSimulation({
        city: effectiveCityString,
        scenario,
        severity,
        nPairs,
        useUSGS,
      });
      setSimResult(res);
      setEdgesGeo(res.edges_geojson);
      setRemovedGeo(res.removed_edges_geojson);
      setStatus("Done.");
    } catch (err) {
      console.error(err);
      setStatus("Error running simulation.");
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived UI numbers
  const totalRoads = edgesGeo?.features?.length || 0;
  const disrupted = simResult?.n_removed_edges || 0;
  const remaining = totalRoads - disrupted;
  const resilienceScore =
    simResult && simResult.avg_ratio > 0
      ? (1 / simResult.avg_ratio) * 100
      : null;

  return (
    <main
    style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "1rem 2.5rem 3rem",
    }}
    >
      <CitySelector
        currentCity={selectedCity}
        onSelect={(city) => {
          setSelectedCity(city);
          setCityOverride("");
          // AUTO-LOAD BASEMAP
          runSimulation({
            city: city.query,
            scenario: "Random Failure",
            severity: 0.01,   // NO real disruptions
            nPairs: 10,
            useUSGS: false,
        }).then((res) => {
            setSimResult(res);
            setEdgesGeo(res.edges_geojson);
            setRemovedGeo(null);
            });
        }}
      />

      {/* Tabs */}
      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* Controls + content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* Left panel: controls */}
        <section
          style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "1rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Apply Disruption</h3>
          <p
            style={{
              marginTop: 0,
              fontSize: "0.85rem",
              color: "#6b7280",
              marginBottom: "1rem",
            }}
          >
            Select a disruption type and intensity.
          </p>

          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Disruption Intensity
          </label>
          <input
            type="range"
            min={5}
            max={80}
            step={5}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "#6b7280",
              marginBottom: "0.75rem",
            }}
          >
            <span>Minor</span>
            <span>{intensity}%</span>
            <span>Catastrophic</span>
          </div>

          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Disruption Type
          </label>
          <div style={{ display: "grid", gap: "0.4rem", marginBottom: "0.75rem" }}>
            {scenarios.map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setScenario(sc)}
                style={{
                  textAlign: "left",
                  borderRadius: "0.75rem",
                  border:
                    scenario === sc
                      ? "1px solid #4f46e5"
                      : "1px solid #e5e7eb",
                  background:
                    scenario === sc ? "#eef2ff" : "#f9fafb",
                  padding: "0.45rem 0.75rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {sc}
              </button>
            ))}
          </div>

          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Number of OD pairs
          </label>
          <input
            type="number"
            min={10}
            max={200}
            value={nPairs}
            onChange={(e) => setNPairs(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "0.4rem 0.6rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              marginBottom: "0.75rem",
            }}
          >
            <input
              type="checkbox"
              checked={useUSGS}
              onChange={(e) => setUseUSGS(e.target.checked)}
              disabled={scenario !== "Highway Flood"}
            />
            <span>Use USGS flood data (Highway Flood only)</span>
          </label>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading || !effectiveCityString}
            style={{
              width: "100%",
              padding: "0.6rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: "#111827",
              color: "#ffffff",
              fontWeight: 600,
              cursor:
                loading || !effectiveCityString
                  ? "not-allowed"
                  : "pointer",
              marginBottom: "0.35rem",
            }}
          >
            {loading ? "Running…" : "Run Simulation"}
          </button>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#6b7280",
              minHeight: "1.2em",
            }}
          >
            {status}
          </div>
        </section>

        {/* Right panel: main content */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activeTab === "visual" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>
                    {selectedCity
                      ? `${selectedCity.label} Road Network`
                      : "Road Network Visualization"}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: "#6b7280",
                    }}
                  >
                    Drivable road network after disruption.
                  </p>
                </div>
                {simResult && (
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <MetricPill
                      label="Active Roads"
                      primary={remaining.toLocaleString()}
                      secondary={
                        disrupted > 0
                          ? `–${disrupted.toLocaleString()} impacted`
                          : ""
                      }
                    />
                    <MetricPill
                      label="Resilience"
                      primary={
                        resilienceScore != null
                          ? `${resilienceScore.toFixed(1)}%`
                          : "—"
                      }
                      secondary={
                        simResult?.pct_disconnected != null
                          ? `${simResult.pct_disconnected.toFixed(
                              1
                            )}% OD pairs disconnected`
                          : ""
                      }
                    />
                  </div>
                )}
              </div>

              <NetworkMap
              edges={edgesGeo}
              removedEdges={removedGeo}
              scenario={scenario}
              />
              <Legend />
            </>
          )}

          {activeTab === "comparison" && (
            <div
              style={{
                background: "#ffffff",
                padding: "1.25rem",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <ComparisonMaps
                edges={edgesGeo}
                removedEdges={removedGeo}
                scenario={scenario}
                metrics={simResult}
              />
            </div>
          )}

          {activeTab === "resilience" && (
            <div
              style={{
                background: "#ffffff",
                padding: "1.25rem",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Resilience Analysis</h3>
              <p
                style={{
                  marginTop: 0,
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                This view will summarize how structural network features
                relate to resilience, once we plug in the multi-city +
                ML results.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <SummaryCard
                  title="Total Simulations"
                  value={simResult ? 1 : 0}
                />
                <SummaryCard
                  title="Avg Resilience"
                  value={
                    resilienceScore != null
                      ? `${resilienceScore.toFixed(1)}%`
                      : "—"
                  }
                />
                <SummaryCard
                  title="Cities Tested"
                  value={simResult ? 1 : 0}
                />
                <SummaryCard
                  title="Most Resilient"
                  value={selectedCity ? selectedCity.label : "—"}
                />
              </div>

              <div
                style={{
                  borderRadius: "0.75rem",
                  border: "1px dashed #e5e7eb",
                  padding: "1rem",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                ML visualizations (feature importances, correlations)
                will plug in here once you have a backend endpoint that
                returns per-city features and resilience scores. For now
                this card is just a placeholder shell – no fake numbers.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricPill({ label, primary, secondary }) {
  return (
    <div
      style={{
        padding: "0.4rem 0.8rem",
        borderRadius: "999px",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#6b7280" }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{primary}</div>
      {secondary && (
        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{secondary}</div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        padding: "0.9rem 1rem",
        borderRadius: "0.9rem",
        background: "linear-gradient(135deg,#eef2ff,#f5f3ff)",
        border: "1px solid #e0e7ff",
      }}
    >
      <div
        style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{value}</div>
    </div>
  );
}

export default Dashboard;