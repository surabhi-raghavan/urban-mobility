// src/components/ml/CityFeatureTable.jsx
export default function CityFeatureTable({ features }) {
  if (!features) return null;

  return (
    <div
      style={{
        background: "white",
        padding: "1rem",
        borderRadius: "1rem",
        maxHeight: "380px",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginTop: 0 }}>City Structural Features</h3>

      <table style={{ width: "100%", fontSize: "0.9rem" }}>
        <tbody>
          {Object.entries(features).map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "4px 8px", color: "#6b7280" }}>{k}</td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {typeof v === "number" ? v.toFixed(4) : v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
