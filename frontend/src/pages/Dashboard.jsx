// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import CitySelector from "../components/city/CitySelector";
import Tabs from "../components/layout/Tabs";
import Legend from "../components/Legend";
import NetworkMap from "../components/maps/NetworkMap";
import ComparisonMaps from "../components/maps/ComparisonMaps";
import { fetchScenarios, runSimulation } from "../api/client";
import MLDashboard from "./MLDashboard";

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
              <h3>Resilience Analysis</h3>
              <p
                style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 0 }}
              >
                Summary of the disruption impact based on the current
                simulation.
              </p>

              {/* SUMMARY GRID */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <SummaryCard title="Total Roads" value={totalRoads} />
                <SummaryCard title="Disrupted Roads" value={disrupted} />
                <SummaryCard title="Remaining Roads" value={remaining} />
                <SummaryCard
                  title="Resilience Score"
                  value={
                    resilienceScore != null
                      ? `${resilienceScore.toFixed(1)}%`
                      : "—"
                  }
                />
              </div>

              {/* (2) DISRUPTION BREAKDOWN */}
              {removedGeo && (
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.9rem",
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>What Was Disrupted?</h4>
                  {(() => {
                    const feats = removedGeo.features || [];

                    const bridges = feats.filter(
                      (f) => f.properties.bridge
                    ).length;
                    const tunnels = feats.filter(
                      (f) => f.properties.tunnel
                    ).length;
                    const highways = feats.filter((f) =>
                      (f.properties.highway || "").includes("motorway")
                    ).length;
                    const major = feats.filter((f) => {
                      const h = f.properties.highway || "";
                      return (
                        h.includes("motorway") ||
                        h.includes("trunk") ||
                        h.includes("primary") ||
                        h.includes("secondary")
                      );
                    }).length;
                    const local = feats.length - major;

                    return (
                      <>
                        <p>
                          <strong>Bridges removed:</strong> {bridges}
                        </p>
                        <p>
                          <strong>Tunnels removed:</strong> {tunnels}
                        </p>
                        <p>
                          <strong>Highways removed:</strong> {highways}
                        </p>
                        <p>
                          <strong>Major roads removed:</strong> {major}
                        </p>
                        <p>
                          <strong>Local roads removed:</strong> {local}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* (3) SEVERITY–RESILIENCE TREND (placeholder chart) */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  background: "white",
                }}
              >
                <h4 style={{ marginTop: 0 }}>
                  Severity vs. Predicted Resilience
                </h4>
                <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  This will show how resilience changes as shock severity
                  increases. (ML model curve upcoming.)
                </p>
                <div
                  style={{
                    height: "150px",
                    background: "#eef2ff",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                  }}
                >
                  Chart coming soon…
                </div>
              </div>

              {/* (4) PER-CITY ML STRUCTURAL SCORE (only if selected city exists) */}
              {selectedCity && (
                <div
                  style={{
                    background: "#fdfdfd",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>
                    Structural Stability Indicators
                  </h4>
                  <p style={{ fontSize: "0.85rem", marginTop: 0 }}>
                    Based on ML-derived structural features.
                  </p>

                  {(() => {
                    const f = simResult?.struct_features;
                    if (!f) return <p>No structural features available.</p>;

                    const effScore = (
                      0.4 * (1 - f.feat_aspl_norm) +
                      0.6 * f.feat_clustering
                    ).toFixed(2);

                    const vulnScore = (
                      0.7 * f.feat_bc_max_norm +
                      0.3 * (1 - f.feat_redundancy)
                    ).toFixed(2);

                    const redundScore = f.feat_redundancy.toFixed(2);

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "0.75rem",
                        }}
                      >
                        <SummaryCard
                          title="Efficiency Score"
                          value={effScore}
                        />
                        <SummaryCard
                          title="Vulnerability Score"
                          value={vulnScore}
                        />
                        <SummaryCard
                          title="Redundancy Score"
                          value={redundScore}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* (5) TOP 5 BOTTLENECKS */}
              {edgesGeo && (
                <div
                  style={{
                    background: "#fff7ed",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #fed7aa",
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>
                    Top 5 Bottlenecks (by Betweenness)
                  </h4>

                  {(() => {
                    const feats = edgesGeo.features || [];
                    const ranked = feats
                      .filter((f) => f.properties.bc != null)
                      .sort((a, b) => b.properties.bc - a.properties.bc)
                      .slice(0, 5);

                    return ranked.map((e, i) => (
                      <p key={i}>
                        <strong>#{i + 1}</strong> — bc=
                        {e.properties.bc.toFixed(4)}
                        (u={e.properties.u}, v={e.properties.v})
                      </p>
                    ));
                  })()}
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
