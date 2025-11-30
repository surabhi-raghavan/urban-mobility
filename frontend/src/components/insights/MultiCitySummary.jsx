// src/components/insights/MultiCitySummary.jsx

function MultiCitySummary({ history }) {
  if (!history || history.length === 0) {
    return (
      <div
        style={{
          padding: "0.8rem 1rem",
          borderRadius: "0.9rem",
          border: "1px dashed #e5e7eb",
          fontSize: "0.85rem",
          color: "#6b7280",
        }}
      >
        Run simulations for multiple cities and scenarios to see a summary
        comparison here.
      </div>
    );
  }

  // group by city
  const byCity = {};
  history.forEach((h) => {
    if (!byCity[h.cityLabel]) byCity[h.cityLabel] = [];
    byCity[h.cityLabel].push(h);
  });

  const rows = Object.entries(byCity).map(([city, runs]) => {
    const n = runs.length;
    const avgResilience =
      runs.reduce((acc, r) => {
        if (!r.avgRatio || r.avgRatio <= 0) return acc;
        return acc + 1 / r.avgRatio;
      }, 0) / n;

    const avgDisc =
      runs.reduce((acc, r) => acc + (r.pctDisconnected || 0), 0) / n;

    return {
      city,
      nRuns: n,
      avgResiliencePct: avgResilience * 100,
      avgDisconnected: avgDisc,
    };
  });

  rows.sort((a, b) => b.avgResiliencePct - a.avgResiliencePct);

  return (
    <div
      style={{
        borderRadius: "0.9rem",
        border: "1px solid #e5e7eb",
        padding: "1rem",
        fontSize: "0.85rem",
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: "0.4rem" }}>
        Multi-city resilience overview
      </h4>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "0.25rem 0.3rem" }}>
              City
            </th>
            <th style={{ textAlign: "right", padding: "0.25rem 0.3rem" }}>
              Runs
            </th>
            <th style={{ textAlign: "right", padding: "0.25rem 0.3rem" }}>
              Avg Resilience
            </th>
            <th style={{ textAlign: "right", padding: "0.25rem 0.3rem" }}>
              Avg OD Disconnected
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.city}>
              <td style={{ padding: "0.22rem 0.3rem" }}>{r.city}</td>
              <td style={{ padding: "0.22rem 0.3rem", textAlign: "right" }}>
                {r.nRuns}
              </td>
              <td style={{ padding: "0.22rem 0.3rem", textAlign: "right" }}>
                {r.avgResiliencePct.toFixed(1)}%
              </td>
              <td style={{ padding: "0.22rem 0.3rem", textAlign: "right" }}>
                {r.avgDisconnected.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p
        style={{
          marginTop: "0.5rem",
          marginBottom: 0,
          color: "#6b7280",
        }}
      >
        You can use this table directly in the report to justify which cities
        are structurally more resilient across multiple disruption scenarios.
      </p>
    </div>
  );
}

export default MultiCitySummary;
