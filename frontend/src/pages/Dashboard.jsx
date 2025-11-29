// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import CitySelector from "../components/city/CitySelector";
import Tabs from "../components/layout/Tabs";
import Legend from "../components/Legend";
import NetworkMap from "../components/maps/NetworkMap";
import ComparisonMaps from "../components/maps/ComparisonMaps";
import { fetchScenarios, runSimulation } from "../api/client";
import MLDashboard from "./MLDashboard";
import Evaluation from "./Evaluation.jsx";

function Dashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState("visual");

  const [selectedCity, setSelectedCity] = useState(null);
  const [cityOverride, setCityOverride] = useState("");

  const [scenario, setScenario] = useState("");
  const [intensity, setIntensity] = useState(40);
  const [nPairs, setNPairs] = useState(40);
  const [useUSGS, setUseUSGS] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [edgesGeo, setEdgesGeo] = useState(null);
  const [removedGeo, setRemovedGeo] = useState(null);

  const [resilienceHistory, setResilienceHistory] = useState([]);
  const [cityRankings, setCityRankings] = useState([]);
  const [allCityResilience, setAllCityResilience] = useState([]);

  useEffect(() => {
    fetchScenarios().then((scs) => {
      setScenarios(scs);
      if (!scenario && scs.length) setScenario(scs[0]);
    });
  }, [scenario]);

  const effectiveCityString = useMemo(() => {
    if (cityOverride.trim()) return cityOverride.trim();
    if (selectedCity) return selectedCity.query;
    return "";
  }, [cityOverride, selectedCity]);

  const severity = useMemo(() => {
    const frac = intensity / 100;
    return 0.01 + frac * (0.5 - 0.01);
  }, [intensity]);

  const handleRun = async () => {
    if (!effectiveCityString) return alert("Select a city first.");
    if (!scenario) return alert("Choose a disruption type.");

    try {
      setLoading(true);
      setStatus("Loading network…");

      const res = await runSimulation({
        city: effectiveCityString,
        scenario,
        severity,
        nPairs,
        useUSGS,
      });

      setSimResult(res);
      // Save resilience history (trend)
      if (res.avg_ratio > 0) {
        const resilienceValue = (1 / res.avg_ratio) * 100;
        setResilienceHistory((h) => [
          ...h,
          { resilience: resilienceValue, timestamp: Date.now() },
        ]);
      }
      setEdgesGeo(res.edges_geojson);
      setRemovedGeo(res.removed_edges_geojson);
      setStatus("Done.");

      // Auto compute rankings for all default cities if not computed
      if (cityRankings.length === 0) {
        const citiesToCompare = [
          "Chicago, Illinois, USA",
          "Pittsburgh, Pennsylvania, USA",
          "San Francisco, California, USA",
          "Boston, Massachusetts, USA",
        ];

        Promise.all(
          citiesToCompare.map(async (c) => {
            const res2 = await runSimulation({
              city: c,
              scenario,
              severity,
              nPairs,
              useUSGS,
            });
            return {
              city: c,
              resilience: res2.avg_ratio > 0 ? (1 / res2.avg_ratio) * 100 : 0,
            };
          })
        ).then((scores) => setCityRankings(scores));
      }
    } catch (err) {
      console.error(err);
      setStatus("Error running simulation.");
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- FIX: SAFE METRIC COMPUTATION -----
  const totalRoads = edgesGeo?.features?.length ?? 0;
  const disrupted = simResult?.n_removed_edges ?? 0;
  const remaining = totalRoads - disrupted;
  const resilienceScore =
    simResult?.avg_ratio && simResult.avg_ratio > 0
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

          runSimulation({
            city: city.query,
            scenario: "Random Failure",
            severity: 0.01,
            nPairs: 10,
            useUSGS: false,
          }).then((res) => {
            setSimResult(res);
            setEdgesGeo(res.edges_geojson);
            setRemovedGeo(null);
          });
        }}
      />

      <Tabs active={activeTab} onChange={setActiveTab} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT PANEL */}
        <section
          style={{
            background: "#fff",
            padding: "1.25rem",
            borderRadius: "1rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3>Apply Disruption</h3>

          <label>Intensity</label>
          <input
            type="range"
            min={5}
            max={80}
            step={5}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ width: "100%" }}
          />

          <label>Disruption Type</label>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            {scenarios.map((sc) => (
              <button
                key={sc}
                onClick={() => setScenario(sc)}
                style={{
                  textAlign: "left",
                  borderRadius: "0.75rem",
                  border:
                    scenario === sc ? "1px solid #4f46e5" : "1px solid #e5e7eb",
                  background: scenario === sc ? "#eef2ff" : "#f9fafb",
                  padding: "0.45rem 0.75rem",
                  cursor: "pointer",
                }}
              >
                {sc}
              </button>
            ))}
          </div>

          <button
            onClick={handleRun}
            disabled={loading || !effectiveCityString}
            style={{
              width: "100%",
              padding: "0.6rem",
              marginTop: "1rem",
              borderRadius: "999px",
              background: "#111827",
              color: "white",
            }}
          >
            {loading ? "Running…" : "Run Simulation"}
          </button>

          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{status}</div>
        </section>

        {/* RIGHT CONTENT */}
        <section
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* VISUAL TAB */}
          {activeTab === "visual" && (
            <>
              <h3>
                {selectedCity
                  ? `${selectedCity.label} Road Network`
                  : "Road Network Visualization"}
              </h3>

              <NetworkMap
                edges={edgesGeo}
                removedEdges={removedGeo}
                scenario={scenario}
              />
              <Legend />
            </>
          )}

          {/* COMPARISON */}
          {activeTab === "comparison" && (
            <div
              style={{
                background: "#fff",
                padding: "1.25rem",
                borderRadius: "1rem",
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

          {/* —— ENHANCED RESILIENCE TAB —— */}
          {activeTab === "resilience" && (
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <h3>Resilience Analysis & City Comparison</h3>

              {/* CITY B SELECTION */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h4>Primary City</h4>
                  <p style={{ color: "#6b7280" }}>
                    Selected: {effectiveCityString || "None"}
                  </p>
                </div>

                <div style={{ flex: 1 }}>
                  <h4>Compare With</h4>
                  <input
                    type="text"
                    placeholder="Enter second city (e.g., Boston, MA)"
                    value={cityOverrideCompare || ""}
                    onChange={(e) => setCityOverrideCompare(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              </div>

              {/* ONE BUTTON */}
              <button
                onClick={handleCompareCities}
                style={{
                  padding: "0.6rem 1rem",
                  background: "#4f46e5",
                  color: "white",
                  borderRadius: "8px",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                Compare Cities
              </button>

              {/* RESULTS SECTION */}
              {compareResults && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <h4>{compareResults.cityA.city}</h4>
                    <SummaryCard
                      title="Resilience Score"
                      value={`${compareResults.cityA.score.toFixed(1)}%`}
                    />
                    <SummaryCard
                      title="Disrupted Roads"
                      value={compareResults.cityA.disrupted}
                    />
                    <SummaryCard
                      title="Remaining Roads"
                      value={compareResults.cityA.remaining}
                    />
                  </div>

                  <div>
                    <h4>{compareResults.cityB.city}</h4>
                    <SummaryCard
                      title="Resilience Score"
                      value={`${compareResults.cityB.score.toFixed(1)}%`}
                    />
                    <SummaryCard
                      title="Disrupted Roads"
                      value={compareResults.cityB.disrupted}
                    />
                    <SummaryCard
                      title="Remaining Roads"
                      value={compareResults.cityB.remaining}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ML INSIGHTS */}
          {activeTab === "ml" && (
            <div
              style={{
                background: "#fff",
                padding: "1.25rem",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <MLDashboard city={effectiveCityString} />
            </div>
          )}

          {activeTab === "evaluation" && (
            <div
              style={{
                background: "#fff",
                padding: "1.25rem",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <Evaluation />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        padding: "0.9rem 1rem",
        borderRadius: "0.9rem",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{value}</div>
    </div>
  );
}

export default Dashboard;
