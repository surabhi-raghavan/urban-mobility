// src/components/city/CitySelector.jsx
import { useMemo, useState } from "react";
import { POPULAR_CITIES } from "../../constants/cities";

function CitySelector({ currentCity, onSelect }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return POPULAR_CITIES.filter((c) =>
      c.label.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "1.25rem",
        padding: "1.5rem 1.75rem",
        boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
        marginBottom: "1.75rem",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "1rem",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "999px",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4f46e5",
            fontSize: 16,
          }}
        >
          📍
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Select a US City
          </h2>
          <p
            style={{
              margin: 0,
              marginTop: 2,
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Search for any city or choose from popular options.
          </p>
        </div>
      </div>

      {/* Search bar + button */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "0.9rem",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            padding: "0.45rem 0.9rem",
            background: "#f9fafb",
            gap: "0.5rem",
          }}
        >
          <span style={{ color: "#9ca3af", fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Search for a city (e.g., Chicago)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              fontSize: "0.95rem",
              color: "#111827",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (matches[0]) onSelect(matches[0]);
          }}
          style={{
            padding: "0.55rem 1.3rem",
            borderRadius: "999px",
            border: "none",
            background: "#6366f1",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(99,102,241,0.45)",
            whiteSpace: "nowrap",
          }}
        >
          Search
        </button>
      </div>

      {/* Search results (if any) */}
      {query && (
        <div style={{ marginBottom: "0.9rem" }}>
          <div
            style={{
              fontSize: "0.82rem",
              color: "#6b7280",
              marginBottom: "0.25rem",
            }}
          >
            Search Results:
          </div>
          {matches.length === 0 && (
            <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              No matching preset cities. You can still enter a full city
              string directly in the disruption panel.
            </div>
          )}
          {matches.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                onSelect(c);
                setQuery(c.label);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                cursor: "pointer",
                marginBottom: "0.25rem",
                fontSize: "0.9rem",
                color: "#111827",
              }}
            >
              <span style={{ marginRight: "0.4rem" }}>📍</span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Popular cities */}
      <div
        style={{
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        Popular Cities:
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: currentCity ? "0.9rem" : 0,
        }}
      >
        {POPULAR_CITIES.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              onSelect(c);
              setQuery(c.label);
            }}
            style={{
              borderRadius: "999px",
              padding: "0.4rem 0.9rem",
              border:
                currentCity?.label === c.label
                  ? "1px solid #4f46e5"
                  : "1px solid #e5e7eb",
              background:
                currentCity?.label === c.label ? "#eef2ff" : "#ffffff",
              cursor: "pointer",
              fontSize: "0.9rem",
              color: "#111827",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Currently analyzing banner */}
      {currentCity && (
        <div
          style={{
            marginTop: "0.25rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.9rem",
            background:
              "linear-gradient(135deg, rgba(129,140,248,0.12), rgba(196,181,253,0.12))",
            border: "1px solid rgba(129,140,248,0.35)",
            fontSize: "0.9rem",
          }}
        >
          <span style={{ color: "#4f46e5", marginRight: 6 }}>●</span>
          <strong>Currently analyzing:</strong> {currentCity.label}
        </div>
      )}
    </section>
  );
}

export default CitySelector;