function Legend() {
  const items = [
    { color: "#9ca3af", label: "Local roads" },
    { color: "#1d4ed8", label: "Major highways" },
    { color: "#ef4444", label: "Disrupted roads" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.75rem",
        background: "#111827",
        color: "white",
        fontSize: "0.8rem",
        marginTop: "0.75rem",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {items.map((it) => (
          <div
            key={it.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: "fit-content",
            }}
          >
            <span
              style={{
                width: 24,
                height: 0,
                borderTop: `3px solid ${it.color}`,
                display: "inline-block",
              }}
            />
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <div style={{ flexGrow: 1 }} />
      <span style={{ opacity: 0.75 }}>Drag to pan · Scroll to zoom</span>
    </div>
  );
}

export default Legend;
