import NetworkMap from "./NetworkMap";

function ComparisonMaps({ edges, removedEdges, scenario, metrics }) {
  if (!edges) {
    return (
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "1rem",
          border: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        Run a simulation first to compare before/after.
      </div>
    );
  }

  const totalRoads = edges.features?.length || 0;
  const disrupted = metrics?.n_removed_edges ?? 0;
  const remaining = totalRoads - disrupted;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Before Disruption</h3>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          Intact road network
        </p>
        <NetworkMap edges={edges} removedEdges={null} scenario={scenario} />
        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          <strong>Roads:</strong> {totalRoads}
        </div>
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>After Disruption</h3>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          Network after {scenario.toLowerCase()}
        </p>
        <NetworkMap
          edges={edges}
          removedEdges={removedEdges}
          scenario={scenario}
        />
        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          <strong>Roads:</strong> {remaining}{" "}
          <span style={{ color: "#dc2626" }}>
            (–{disrupted.toLocaleString()} disrupted)
          </span>
        </div>
      </div>
    </div>
  );
}

export default ComparisonMaps;
