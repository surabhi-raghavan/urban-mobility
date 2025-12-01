// src/components/city/CitySelector.jsx
import { useEffect, useMemo, useState } from "react";
import usCities from "../../data/us_cities.json";

// Helper to normalize text for matching
function normalize(str) {
  return str.toLowerCase().trim();
}

const DEFAULT_PRESET_CITIES = [
  "Chicago, IL",
  "Pittsburgh, PA",
  "Dallas, TX",
  "Phoenix, AZ",
  "San Francisco, CA",
];

function CitySelector({
  selectedCity,
  onCityChange,
  presetCities = DEFAULT_PRESET_CITIES,
}) {
  const [query, setQuery] = useState(selectedCity || "");
  const [touched, setTouched] = useState(false);

  // Keep input in sync if selectedCity changes from outside
  useEffect(() => {
    if (!touched) {
      setQuery(selectedCity || "");
    }
  }, [selectedCity, touched]);

  // Build full label for each city
  const cityOptions = useMemo(
    () =>
      usCities.map((c) => ({
        ...c,
        label: `${c.name}, ${c.state}`,
      })),
    []
  );

  // Filter cities when user types; only show after 2+ chars
  const filteredResults = useMemo(() => {
    const q = normalize(query);
    if (q.length < 2) return [];
    return cityOptions
      .filter((c) => normalize(c.label).includes(q))
      .slice(0, 8);
  }, [query, cityOptions]);

  const hasResults = filteredResults.length > 0;

  const handleSelect = (label) => {
    setQuery(label);
    setTouched(true);
    if (onCityChange) {
      onCityChange(label);
    }
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setTouched(true);
    if (onCityChange) {
      onCityChange(trimmed);
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "1.5rem",
        padding: "1.5rem 1.75rem",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 20%, #f97316, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1rem",
          }}
        >
          📍
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: "1.05rem",
            }}
          >
            Select a US City
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              color: "#6b7280",
              marginTop: 2,
            }}
          >
            Search any city or choose from popular options.
          </div>
        </div>
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearchClick}
        style={{
          marginTop: "1.25rem",
          display: "flex",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1rem",
              color: "#9ca3af",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTouched(true);
            }}
            placeholder="e.g., Houston, TX"
            style={{
              width: "100%",
              borderRadius: "999px",
              border: "1px solid #e5e7eb",
              padding: "0.65rem 1rem 0.65rem 2.4rem",
              outline: "none",
              fontSize: "0.95rem",
              background: "#f9fafb",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            borderRadius: "999px",
            border: "none",
            padding: "0.65rem 1.4rem",
            background: "#4f46e5",
            color: "white",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(79, 70, 229, 0.35)",
          }}
        >
          Search
        </button>
      </form>

      {/* Search results */}
      <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        <div
          style={{
            fontWeight: 500,
            marginBottom: "0.25rem",
            color: "#6b7280",
          }}
        >
          Search Results:
        </div>
        {hasResults ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.25rem",
            }}
          >
            {filteredResults.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => handleSelect(c.label)}
                style={{
                  borderRadius: "999px",
                  border: "1px solid #e5e7eb",
                  background:
                    normalize(selectedCity || "") === normalize(c.label)
                      ? "#eef2ff"
                      : "white",
                  padding: "0.3rem 0.8rem",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <div
            style={{
              color: "#9ca3af",
              marginTop: "0.15rem",
            }}
          >
            No matching cities in the local list. You can still run a
            simulation using the typed city name.
          </div>
        ) : (
          <div
            style={{
              color: "#9ca3af",
              marginTop: "0.15rem",
            }}
          >
            Start typing a city name to see matches.
          </div>
        )}
      </div>

      {/* Popular preset cities */}
      <div style={{ marginTop: "1.25rem", fontSize: "0.9rem" }}>
        <div
          style={{
            fontWeight: 500,
            marginBottom: "0.35rem",
            color: "#6b7280",
          }}
        >
          Popular Cities:
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {presetCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              style={{
                borderRadius: "999px",
                border: "1px solid #e5e7eb",
                background:
                  normalize(selectedCity || "") === normalize(city)
                    ? "#eef2ff"
                    : "white",
                padding: "0.3rem 0.9rem",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CitySelector;