// src/components/Legend.jsx

function Legend() {
  const items = [
    { color: "#9ca3af", label: "Local roads", dashed: false },
    { color: "#1d4ed8", label: "Major highways", dashed: false },
    { color: "#ef4444", label: "Disrupted roads", dashed: false },
    { color: "#22c55e", label: "Major hubs", dashed: false },
    { color: "#3b82f6", label: "Intersections", dashed: false },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.75rem",
        background: "#111827",
        color: "white",
        fontSize: "0.8rem",
        marginTop: "0.75rem",
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              width: 24,
              height: 0,
              borderTop: `3px ${
                it.dashed ? "dashed" : "solid"
              } ${it.color}`,
              display: "inline-block",
            }}
          />
          <span>{it.label}</span>
        </div>
      ))}
      <span style={{ marginLeft: "auto", opacity: 0.8 }}>
        Drag to pan · Scroll to zoom
      </span>
    </div>
  );
}

export default Legend;